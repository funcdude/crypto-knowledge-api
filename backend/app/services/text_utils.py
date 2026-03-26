"""Utilities for cleaning up PDF-extracted text that has lost word spaces."""

import re
import math
import wordninja

# ---------------------------------------------------------------------------
# Augment the default wordninja model with crypto-specific vocabulary.
# Lower cost = higher probability = model prefers this segmentation.
# We use cost=log(1 * log(2)) which is the lowest possible (rank 1).
# ---------------------------------------------------------------------------

_CRYPTO_WORDS = [
    # Protocols / blockchains
    "ethereum", "vitalik", "buterin",
    "solana", "cardano", "polkadot", "avalanche", "chainlink",
    "ripple", "litecoin", "dogecoin", "shiba",
    # DeFi / products
    "uniswap", "aave", "compound", "opensea", "coinbase", "kraken",
    "binance", "metamask", "ledger", "trezor",
    "usdc", "usdt", "dai", "bnb",
    # Concepts
    "defi", "dao", "daos", "nft", "nfts", "ico", "ido", "cefi",
    "kyc", "aml", "pos", "pow",
    "permissionless", "trustless", "decentralized",
    "stablecoin", "stablecoins", "altcoin", "altcoins",
    "mempool", "multisig", "hodl", "tokenomics",
    "nonfungible", "deflationary", "inflationary",
    "hashrate", "blockchain",
    # People / authors
    "nakamoto", "satoshi", "halfinney", "szabo",
    "cantillon", "saifedean", "ammous",
    # Web3 terms
    "metaverse", "interoperability", "composability",
    "staking", "validator", "validators",
    "delegator", "delegators", "cryptography",
]

_TOP_COST = math.log(1 * math.log(2))

_lm = wordninja.DEFAULT_LANGUAGE_MODEL
for _word in _CRYPTO_WORDS:
    _lm._wordcost[_word] = _TOP_COST
if _CRYPTO_WORDS:
    _lm._maxword = max(_lm._maxword, max(len(w) for w in _CRYPTO_WORDS))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def fix_concatenated_text(text: str) -> str:
    """
    Re-insert spaces lost during PDF text extraction.

    Strategy: split on non-alpha runs (digits, punctuation, whitespace) to
    preserve them verbatim, then apply a crypto-aware wordninja model to each
    purely-alphabetic segment.  The original casing is preserved by applying
    the model to the lowercase form and mapping character positions back.
    """
    if not text:
        return text

    def _fix_alpha_segment(segment: str) -> str:
        if " " in segment:
            return segment
        lower = segment.lower()
        words_lower = _lm.split(lower)
        result = []
        pos = 0
        for word in words_lower:
            result.append(segment[pos: pos + len(word)])
            pos += len(word)
        return " ".join(result)

    parts = re.split(r"([^a-zA-Z]+)", text)
    fixed = []
    for part in parts:
        if part and part[0].isalpha():
            fixed.append(_fix_alpha_segment(part))
        else:
            fixed.append(part)
    return "".join(fixed)


def should_fix(content: str) -> bool:
    """
    Return True when the content looks like PDF-extracted concatenated text.
    Heuristic: fewer than 6% of characters are spaces.
    """
    if not content:
        return False
    return content.count(" ") / max(len(content), 1) < 0.06


def clean_punctuation(text: str) -> str:
    """
    Fix common punctuation spacing issues from PDF extraction.
    Always safe to run — only adds missing spaces, never removes existing ones.
    """
    if not text:
        return text
    text = re.sub(r',([A-Za-z])', r', \1', text)
    text = re.sub(r'\.([A-Z])', r'. \1', text)
    text = re.sub(r'\)([A-Za-z])', r') \1', text)
    text = re.sub(r'([a-z])(\d{4})', r'\1 \2', text)
    text = re.sub(r'(\d)([A-Z])', r'\1 \2', text)
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)
    text = re.sub(r':([A-Za-z])', r': \1', text)
    text = re.sub(r';([A-Za-z])', r'; \1', text)
    text = re.sub(r'by(\d)', r'by \1', text)
    return text
