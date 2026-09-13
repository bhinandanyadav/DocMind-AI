"""Local study material generator using NLTK extractive NLP.

Generates structured notes, MCQs, questions, and flashcards from document
chunks without requiring an external LLM API key.
"""

from __future__ import annotations

import random
import re
from collections import Counter, defaultdict
from typing import Any

import nltk
from nltk.corpus import stopwords
from nltk.tokenize import sent_tokenize, word_tokenize

# Ensure NLTK data is available
for _res in ("punkt", "punkt_tab", "stopwords", "averaged_perceptron_tagger", "averaged_perceptron_tagger_eng"):
    try:
        nltk.data.find(f"tokenizers/{_res}" if "punkt" in _res else f"corpora/{_res}" if "stopwords" in _res else f"taggers/{_res}")
    except LookupError:
        nltk.download(_res, quiet=True)

_STOP_WORDS = set(stopwords.words("english"))
_NOUN_POS = {"NN", "NNS", "NNP", "NNPS"}
_ADJ_POS = {"JJ", "JJR", "JJS"}
_VB_POS = {"VB", "VBD", "VBG", "VBN", "VBP", "VBZ"}
_CONTENT_POS = _NOUN_POS | _ADJ_POS | _VB_POS

# Blacklist: common words that should never be extracted as "terms"
_BLACKLIST = {
    "there", "this", "that", "these", "those", "it", "its", "they", "them",
    "their", "which", "what", "where", "when", "who", "whom", "how", "can",
    "will", "may", "might", "should", "could", "would", "must", "shall",
    "also", "just", "only", "even", "still", "already", "yet", "now",
    "more", "most", "less", "least", "very", "much", "many", "such",
    "each", "every", "all", "both", "few", "some", "any", "none",
    "about", "into", "over", "after", "before", "between", "under",
    "make", "makes", "made", "use", "used", "using", "get", "gets",
    "take", "takes", "taken", "give", "gives", "given", "come", "comes",
    "go", "goes", "went", "see", "sees", "saw", "know", "knows", "knew",
    "think", "thinks", "thought", "say", "says", "said", "tell", "tells",
    "told", "find", "finds", "found", "want", "wants", "let", "lets",
}

# Patterns for extracting definitions
_DEF_PATTERNS = [
    re.compile(r"^([A-Z][^,]+?)\s+(?:is|are|refers to|means|denotes|describes|is defined as)\s+(.+?)(?:\.|$)", re.I),
    re.compile(r"^([A-Z][^:]+?):\s+(.+?)(?:\.|$)", re.I),
]

# Patterns for identifying question-worthy sentences
_Q_PATTERNS = {
    "definition": re.compile(r"\b(is|are|refers to|means|defined as|denotes)\b", re.I),
    "cause_effect": re.compile(r"\b(because|therefore|thus|hence|as a result|consequently|due to|causes|leads to|results in)\b", re.I),
    "process": re.compile(r"\b(first|second|then|next|finally|step|stage|phase|process|procedure|method)\b", re.I),
    "comparison": re.compile(r"\b(compared to|versus|unlike|whereas|while|on the other hand|in contrast|similarly)\b", re.I),
    "example": re.compile(r"\b(for example|for instance|such as|including|e\.g\.|specifically|namely)\b", re.I),
    "benefit": re.compile(r"\b(advantage|benefit|improve|enhance|increase|reduce|prevent|enable|allow)\b", re.I),
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _split_sentences(text: str) -> list[str]:
    return [_clean(s) for s in sent_tokenize(text) if len(_clean(s)) > 15]


def _content_words(text: str) -> list[str]:
    tokens = word_tokenize(text.lower())
    return [w for w in tokens if w.isalnum() and w not in _STOP_WORDS and len(w) > 2]


def _build_freq(text: str) -> Counter:
    return Counter(_content_words(text))


def _score_sentence(sentence: str, word_freq: Counter) -> float:
    words = _content_words(sentence)
    if not words:
        return 0.0
    return sum(word_freq.get(w, 0) for w in words) / len(words)


def _extract_noun_phrases(text: str, top_n: int = 20) -> list[str]:
    """Extract noun phrases using POS tagging."""
    tokens = word_tokenize(text)
    tagged = nltk.pos_tag(tokens)
    phrases: list[str] = []
    current: list[str] = []
    for word, tag in tagged:
        if tag in _NOUN_POS or (tag in _ADJ_POS and current):
            current.append(word)
        else:
            if current:
                phrase = " ".join(current).lower().strip()
                if _is_valid_term(phrase):
                    phrases.append(phrase)
                current = []
    if current:
        phrase = " ".join(current).lower().strip()
        if _is_valid_term(phrase):
            phrases.append(phrase)
    counts = Counter(phrases)
    return [p for p, _ in counts.most_common(top_n)]


def _is_valid_term(phrase: str) -> bool:
    """Check if a phrase is a valid term (not too short, not blacklisted)."""
    words = phrase.split()
    if len(phrase) < 4 or len(phrase) > 50:
        return False
    # Reject if any word is blacklisted
    if any(w in _BLACKLIST for w in words):
        return False
    # Reject if more than 40% of words are short (1-2 chars)
    short_ratio = sum(1 for w in words if len(w) <= 2) / max(len(words), 1)
    if short_ratio > 0.4:
        return False
    return True


def _extract_definitions(sentences: list[str]) -> list[dict[str, str]]:
    """Extract term-definition pairs from sentences."""
    defs = []
    seen_terms = set()
    for sent in sentences:
        for pattern in _DEF_PATTERNS:
            m = pattern.match(sent)
            if m:
                term = m.group(1).strip().lower()
                definition = m.group(2).strip()
                if (
                    _is_valid_term(term)
                    and term not in seen_terms
                    and len(definition) > 10
                ):
                    seen_terms.add(term)
                    defs.append({"term": term, "definition": _clean(definition)})
                break
    return defs


def _categorize_sentences(sentences: list[str], word_freq: Counter) -> dict[str, list[str]]:
    """Group sentences by their dominant topic/theme."""
    topic_map: dict[str, list[str]] = defaultdict(list)

    for sent in sentences:
        words = _content_words(sent)
        if not words:
            continue
        # Pick the highest-frequency content word as the topic
        topic = max(words, key=lambda w: word_freq.get(w, 0))
        topic_map[topic].append(sent)

    # Keep only topics with 2+ sentences, sorted by total relevance
    result = {}
    for topic, sents in sorted(topic_map.items(), key=lambda x: -len(x[1])):
        if len(sents) >= 2:
            result[topic] = sents
    return result


def _identify_question_type(sentence: str) -> str:
    for qtype, pattern in _Q_PATTERNS.items():
        if pattern.search(sentence):
            return qtype
    return "factual"


def _make_filler_blank(sentence: str) -> tuple[str, str]:
    """Turn a statement into a fill-in-the-blank question."""
    words = sentence.split()
    content = _content_words(sentence)
    if not content:
        return sentence, sentence
    # Pick the most important content word to blank out
    blank_word = max(content, key=lambda w: len(w))
    # Find the word in the sentence (case-insensitive)
    for i, w in enumerate(words):
        if blank_word.lower() in w.lower():
            words[i] = "________"
            break
    question = " ".join(words)
    answer = sentence
    return question, answer


def _generate_definition_question(term: str, definition: str) -> dict[str, Any]:
    """Generate a 'What is X?' question."""
    return {
        "question": f"What is {term.title()}?",
        "answer": definition,
        "type": "definition",
    }


def _generate_process_question(sentences: list[str]) -> dict[str, Any] | None:
    """Generate a 'What are the steps...' question from process sentences."""
    if len(sentences) < 2:
        return None
    steps = []
    for i, s in enumerate(sentences[:5], 1):
        steps.append(f"{i}. {s}")
    first_sent = sentences[0]
    topic_words = _content_words(first_sent)
    topic = " ".join(topic_words[:4]) if topic_words else "this process"
    return {
        "question": f"What are the steps involved in {topic}?",
        "answer": "\n".join(steps),
        "type": "process",
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

class LocalStudyGenerator:
    """Generates study materials from document chunks using extractive NLP."""

    def generate(self, chunks: list[dict[str, Any]]) -> dict[str, Any]:
        full_text = "\n".join(c.get("text", "") for c in chunks)
        all_sentences = []
        for chunk in chunks:
            all_sentences.extend(_split_sentences(chunk.get("text", "")))
        all_sentences = list(dict.fromkeys(all_sentences))  # dedupe

        if not all_sentences:
            return {"notes": [], "mcqs": [], "questions": [], "flashcards": []}

        word_freq = _build_freq(full_text)
        keyphrases = _extract_noun_phrases(full_text, top_n=20)
        definitions = _extract_definitions(all_sentences)

        notes = self._generate_notes(all_sentences, word_freq, keyphrases)
        mcqs = self._generate_mcqs(all_sentences, word_freq, keyphrases, definitions)
        questions = self._generate_questions(all_sentences, word_freq, definitions)
        flashcards = self._generate_flashcards(all_sentences, word_freq, definitions, keyphrases)

        return {
            "notes": notes,
            "mcqs": mcqs,
            "questions": questions,
            "flashcards": flashcards,
        }

    # ---- Notes (grouped by topic with hierarchy) -------------------------

    def _generate_notes(
        self, sentences: list[str], word_freq: Counter, keyphrases: list[str]
    ) -> list[dict[str, Any]]:
        topic_groups = _categorize_sentences(sentences, word_freq)
        notes: list[dict[str, Any]] = []
        note_id = 0

        # Take top topics
        for topic, sents in list(topic_groups.items())[:8]:
            # Pick top 3-5 sentences for this topic
            scored = [(_score_sentence(s, word_freq), s) for s in sents]
            scored.sort(key=lambda x: x[0], reverse=True)
            top_sents = [s for _, s in scored[: min(5, len(scored))]]

            # Find which keyphrases belong to this topic
            related_kps = [
                kp for kp in keyphrases
                if topic in kp or kp.split()[0] == topic
            ]

            note_id += 1
            heading = topic.title()
            if related_kps:
                heading = related_kps[0].title()

            notes.append({
                "id": note_id,
                "title": heading,
                "bullets": [_clean(s).rstrip(".") for s in top_sents],
                "related_terms": related_kps[:3],
            })

        # If we have very few topic groups, supplement with top-scored sentences
        if len(notes) < 3:
            scored = [(_score_sentence(s, word_freq), s) for s in sentences]
            scored.sort(key=lambda x: x[0], reverse=True)
            for _, sent in scored[:5]:
                note_id += 1
                words = _content_words(sent)
                heading = " ".join(words[:3]).title() if words else f"Point {note_id}"
                notes.append({
                    "id": note_id,
                    "title": heading,
                    "bullets": [_clean(sent).rstrip(".")],
                    "related_terms": [],
                })

        return notes

    # ---- MCQs (realistic question styles) --------------------------------

    def _generate_mcqs(
        self,
        sentences: list[str],
        word_freq: Counter,
        keyphrases: list[str],
        definitions: list[dict[str, str]],
    ) -> list[dict[str, Any]]:
        mcqs: list[dict[str, Any]] = []
        used = set()

        # Type 1: Definition MCQs ("What is X?")
        for defn in definitions[:5]:
            if defn["term"] in used:
                continue
            used.add(defn["term"])
            wrong_defs = [d["definition"] for d in definitions if d["term"] != defn["term"]][:3]
            if len(wrong_defs) < 3:
                continue
            options = [defn["definition"]] + wrong_defs
            random.shuffle(options)
            correct = options.index(defn["definition"]) + 1
            mcqs.append({
                "id": len(mcqs) + 1,
                "question": f"What is {defn['term'].title()}?",
                "options": [f"{chr(65+i)}. {o}" for i, o in enumerate(options)],
                "correct_answer": chr(64 + correct),
                "explanation": f"{defn['term'].title()} is {defn['definition']}",
                "type": "definition",
            })

        # Type 2: Fill-in-the-blank MCQs
        scored = [(_score_sentence(s, word_freq), s) for s in sentences if len(s.split()) > 8]
        scored.sort(key=lambda x: x[0], reverse=True)
        for _, sent in scored[:10]:
            if len(mcqs) >= 15:
                break
            content = _content_words(sent)
            if len(content) < 3:
                continue
            # Pick a key term to blank out
            blank = max(content, key=lambda w: word_freq.get(w, 0))
            # Create the question with blank
            q_words = sent.split()
            answer_found = False
            for i, w in enumerate(q_words):
                if blank.lower() in w.lower():
                    q_words[i] = "________"
                    answer_found = True
                    break
            if not answer_found:
                continue

            question = " ".join(q_words)
            # Generate wrong options from other high-freq words
            distractors = [
                w.title() for w, _ in word_freq.most_common(30)
                if w != blank.lower() and len(w) > 2
            ][:3]
            if len(distractors) < 3:
                continue
            options = [blank.title()] + distractors
            random.shuffle(options)
            correct = options.index(blank.title()) + 1
            mcqs.append({
                "id": len(mcqs) + 1,
                "question": question,
                "options": [f"{chr(65+i)}. {o}" for i, o in enumerate(options)],
                "correct_answer": chr(64 + correct),
                "explanation": f"The complete sentence: {sent}",
                "type": "fill_blank",
            })

        # Type 3: Which is NOT / True-False style
        for _, sent in scored:
            if len(mcqs) >= 20:
                break
            qtype = _identify_question_type(sent)
            if qtype in ("definition", "benefit"):
                words = _content_words(sent)
                if len(words) < 3:
                    continue
                topic = " ".join(words[:4])
                # Create a "Which statement is true about X?" question
                related = [s for s in sentences if any(w in s.lower() for w in words[:2]) and s != sent][:3]
                if len(related) < 2:
                    continue
                options = [sent] + related[:3]
                random.shuffle(options)
                correct = options.index(sent) + 1
                mcqs.append({
                    "id": len(mcqs) + 1,
                    "question": f"Which statement about {topic.title()} is correct?",
                    "options": [f"{chr(65+i)}. {_clean(o).rstrip('.')}" for i, o in enumerate(options)],
                    "correct_answer": chr(64 + correct),
                    "explanation": f"Correct: {sent}",
                    "type": "true_false",
                })

        return mcqs[:20]

    # ---- Questions (structured Q&A) --------------------------------------

    def _generate_questions(
        self,
        sentences: list[str],
        word_freq: Counter,
        definitions: list[dict[str, str]],
    ) -> list[dict[str, Any]]:
        questions: list[dict[str, Any]] = []
        used_sents: set[str] = set()

        # Type 1: Definition questions ("Define X", "What is X?")
        for defn in definitions[:5]:
            questions.append({
                "id": len(questions) + 1,
                "question": f"Define: {defn['term'].title()}",
                "answer": defn["definition"],
                "type": "definition",
                "marks": 2,
            })

        # Type 2: Cause-effect questions
        scored = [(_score_sentence(s, word_freq), s) for s in sentences]
        scored.sort(key=lambda x: x[0], reverse=True)

        for _, sent in scored:
            if len(questions) >= 20:
                break
            if sent in used_sents:
                continue
            qtype = _identify_question_type(sent)
            words = _content_words(sent)
            if len(words) < 3:
                continue

            if qtype == "cause_effect":
                questions.append({
                    "id": len(questions) + 1,
                    "question": f"Why or how does this relate: {' '.join(words[:6])}?",
                    "answer": _clean(sent).rstrip("."),
                    "type": "cause_effect",
                    "marks": 3,
                })
                used_sents.add(sent)

            elif qtype == "process":
                # Find related process steps
                process_sents = [
                    s for s in sentences
                    if _identify_question_type(s) == "process" and s not in used_sents
                ][:4]
                if process_sents:
                    steps = "\n".join(f"Step {i}: {s.rstrip('.')}" for i, s in enumerate(process_sents, 1))
                    questions.append({
                        "id": len(questions) + 1,
                        "question": f"Describe the process of {' '.join(words[:4])}",
                        "answer": steps,
                        "type": "process",
                        "marks": 5,
                    })
                    used_sents.update(process_sents)

            elif qtype == "comparison":
                questions.append({
                    "id": len(questions) + 1,
                    "question": f"Compare and explain: {' '.join(words[:6])}",
                    "answer": _clean(sent).rstrip("."),
                    "type": "comparison",
                    "marks": 4,
                })
                used_sents.add(sent)

            elif qtype == "benefit":
                questions.append({
                    "id": len(questions) + 1,
                    "question": f"What are the benefits or advantages of {' '.join(words[:5])}?",
                    "answer": _clean(sent).rstrip("."),
                    "type": "short_answer",
                    "marks": 2,
                })
                used_sents.add(sent)

            elif qtype == "factual" and len(words) > 5:
                # Convert to fill-in-the-blank
                q_words = sent.split()
                blank_word = max(words, key=lambda w: word_freq.get(w, 0))
                for i, w in enumerate(q_words):
                    if blank_word.lower() in w.lower():
                        q_words[i] = "________"
                        break
                questions.append({
                    "id": len(questions) + 1,
                    "question": " ".join(q_words),
                    "answer": _clean(sent).rstrip("."),
                    "type": "fill_blank",
                    "marks": 2,
                })
                used_sents.add(sent)

        # Type 3: Long-answer / essay questions from top sentences
        essay_candidates = [s for _, s in scored[:10] if s not in used_sents]
        for sent in essay_candidates[:3]:
            words = _content_words(sent)
            if len(words) < 4:
                continue
            questions.append({
                "id": len(questions) + 1,
                "question": f"Explain in detail: {' '.join(words[:8])}. Provide examples where applicable.",
                "answer": _clean(sent).rstrip("."),
                "type": "long_answer",
                "marks": 5,
            })
            used_sents.add(sent)

        return questions

    # ---- Flashcards (clean term-definition pairs) ------------------------

    def _generate_flashcards(
        self,
        sentences: list[str],
        word_freq: Counter,
        definitions: list[dict[str, str]],
        keyphrases: list[str],
    ) -> list[dict[str, Any]]:
        cards: list[dict[str, Any]] = []
        seen_terms: set[str] = set()

        # Priority 1: Extracted definitions
        for defn in definitions[:10]:
            term = defn["term"]
            if term in seen_terms:
                continue
            seen_terms.add(term)
            cards.append({
                "id": len(cards) + 1,
                "front": defn["term"].title(),
                "back": defn["definition"].rstrip("."),
                "category": "definition",
            })

        # Priority 2: Keyphrases with best matching sentence
        scored = [(_score_sentence(s, word_freq), s) for s in sentences]
        scored.sort(key=lambda x: x[0], reverse=True)

        for kp in keyphrases[:15]:
            if len(cards) >= 20:
                break
            # Normalize for dedup
            kp_norm = kp.lower().strip()
            if any(kp_norm in seen_terms or seen_term in kp_norm for seen_term in seen_terms):
                continue

            # Find best sentence explaining this keyphrase
            best_sent = ""
            for _, s in scored:
                if kp.lower() in s.lower():
                    best_sent = s
                    break

            if best_sent:
                seen_terms.add(kp_norm)
                # Try to extract a clean definition-style answer
                clean_back = _clean(best_sent).rstrip(".")
                # If the sentence starts with the term, use it directly
                if best_sent.lower().startswith(kp.lower()):
                    clean_back = _clean(best_sent[len(kp):].lstrip(" :–—-")).rstrip(".")
                    if not clean_back:
                        clean_back = _clean(best_sent).rstrip(".")

                cards.append({
                    "id": len(cards) + 1,
                    "front": kp.title(),
                    "back": clean_back,
                    "category": "key_concept",
                })

        # Priority 3: Bold/emphasized terms (markdown **term** or __term__)
        bold_pattern = re.compile(r"\*\*([^*]+)\*\*|__([^_]+)__")
        for sent in sentences:
            if len(cards) >= 25:
                break
            matches = bold_pattern.findall(sent)
            for m in matches:
                term = (m[0] or m[1]).strip()
                if term.lower() in seen_terms or len(term) < 3:
                    continue
                # Use the surrounding sentence as the back
                context = sent.replace(f"**{term}**", "").replace(f"__{term}__", "").strip()
                context = re.sub(r"\s+", " ", context).strip(" :–—-").rstrip(".")
                if context and len(context) > 5:
                    seen_terms.add(term.lower())
                    cards.append({
                        "id": len(cards) + 1,
                        "front": term,
                        "back": context,
                        "category": "definition",
                    })

        # Priority 4: Abbreviation / acronym expansions
        abbrev_pattern = re.compile(r"\b([A-Z]{2,6})\s*\(([^)]+)\)")
        for sent in sentences:
            for m in abbrev_pattern.finditer(sent):
                abbr, full = m.group(1), m.group(2)
                if abbr.lower() not in seen_terms:
                    seen_terms.add(abbr.lower())
                    cards.append({
                        "id": len(cards) + 1,
                        "front": f"{abbr} ({full})",
                        "back": _clean(sent).rstrip("."),
                        "category": "abbreviation",
                    })

        return cards[:25]
