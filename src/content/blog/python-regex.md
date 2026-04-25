---
title: 'Regular Expressions in Python'
description: 'How to utilize regex using python'
pubDate: 'April 24 2026'
heroImage: '/Build_the_web_you_want.png'
---

## What Are Regular Expressions?

Regular expressions (regex) are patterns used to match, search, and manipulate text. Python's built-in `re` module gives you full regex support for everything from simple searches to complex text transformations.

```python
import re
```

---

## Core Functions in the `re` Module

### `re.search()` — Find the First Match

Returns a match object for the first occurrence, or `None`.

```python
text = "Order #4521 was placed on 2025-04-24"
match = re.search(r"#(\d+)", text)
print(match.group(1))  # "4521"
```

### `re.findall()` — Find All Matches

Returns a list of all matching strings.

```python
log = "Errors at 10:03, 10:47, and 11:15"
times = re.findall(r"\d{2}:\d{2}", log)
print(times)  # ['10:03', '10:47', '11:15']
```

### `re.match()` — Match at the Start of a String

Only checks the beginning of the string.

```python
if re.match(r"https?://", "https://example.com"):
    print("Valid URL start")
```

### `re.sub()` — Search and Replace

Replaces all matches with a new string.

```python
raw = "Call me at 801-555-1234 or 801-555-5678"
redacted = re.sub(r"\d{3}-\d{3}-\d{4}", "[REDACTED]", raw)
print(redacted)  # "Call me at [REDACTED] or [REDACTED]"
```

### `re.split()` — Split by Pattern

Splits a string wherever the pattern matches.

```python
data = "apples, oranges;bananas  grapes"
items = re.split(r"[,;\s]+", data)
print(items)  # ['apples', 'oranges', 'bananas', 'grapes']
```

### `re.compile()` — Pre-Compile a Pattern

Improves performance when reusing a pattern many times.

```python
email_pattern = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")
emails = email_pattern.findall("Contact us at info@acme.com or support@acme.com")
```

---

## Essential Pattern Syntax

| Symbol | Meaning | Example |
|--------|---------|---------|
| `.` | Any character (except newline) | `a.c` → "abc", "a1c" |
| `\d` | Any digit (0–9) | `\d{3}` → "123" |
| `\w` | Word character (letter, digit, `_`) | `\w+` → "hello_1" |
| `\s` | Whitespace (space, tab, newline) | `\s+` → "   " |
| `^` | Start of string | `^Hello` |
| `$` | End of string | `world$` |
| `*` | 0 or more | `ab*c` → "ac", "abbc" |
| `+` | 1 or more | `ab+c` → "abc", "abbc" |
| `?` | 0 or 1 (optional) | `colou?r` → "color", "colour" |
| `{n,m}` | Between n and m repetitions | `\d{2,4}` → "12", "1234" |
| `[]` | Character class | `[aeiou]` → any vowel |
| `[^]` | Negated character class | `[^0-9]` → non-digit |
| `\|` | OR | `cat\|dog` |
| `()` | Capture group | `(\d+)-(\d+)` |
| `(?:)` | Non-capturing group | `(?:ab)+` |

---

## Real-World Examples

### 1. Validate an Email Address

```python
def is_valid_email(email):
    pattern = r"^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))

print(is_valid_email("user@example.com"))   # True
print(is_valid_email("bad@@example"))        # False
```

### 2. Extract Prices from Product Listings

```python
listings = """
MacBook Pro — $1,999.00
USB-C Cable — $12.49
Monitor Stand — $349.99
"""

prices = re.findall(r"\$[\d,]+\.\d{2}", listings)
print(prices)  # ['$1,999.00', '$12.49', '$349.99']
```

### 3. Parse a Log File

```python
log_line = '2025-04-24 10:03:22 ERROR [auth] Login failed for user "jdoe"'

pattern = r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) (\w+) \[(\w+)\] (.+)"
match = re.search(pattern, log_line)

if match:
    date, time, level, module, message = match.groups()
    print(f"{level} in {module}: {message}")
    # "ERROR in auth: Login failed for user "jdoe""
```

### 4. Clean and Normalize Phone Numbers

```python
def normalize_phone(phone):
    digits = re.sub(r"\D", "", phone)  # strip non-digits
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    return phone  # return original if unexpected format

print(normalize_phone("801.555.1234"))    # (801) 555-1234
print(normalize_phone("(801) 555-1234"))  # (801) 555-1234
print(normalize_phone("8015551234"))      # (801) 555-1234
```

### 5. Scrape URLs from HTML

```python
html = '<a href="https://example.com">Link</a> and <a href="/about">About</a>'

urls = re.findall(r'href="([^"]+)"', html)
print(urls)  # ['https://example.com', '/about']
```

### 6. Password Strength Validation

```python
def check_password(pw):
    checks = {
        "8+ characters":    r".{8,}",
        "uppercase letter": r"[A-Z]",
        "lowercase letter": r"[a-z]",
        "digit":            r"\d",
        "special character": r"[!@#$%^&*(),.?\":{}|<>]",
    }
    results = {name: bool(re.search(p, pw)) for name, p in checks.items()}
    return results

print(check_password("Hello@123"))
# {'8+ characters': True, 'uppercase letter': True, ...}
```

### 7. Find and Replace Sensitive Data (PII Masking)

```python
text = "SSN: 123-45-6789, DOB: 03/15/1990, Card: 4111-1111-1111-1111"

text = re.sub(r"\d{3}-\d{2}-\d{4}", "XXX-XX-XXXX", text)           # SSN
text = re.sub(r"\d{2}/\d{2}/\d{4}", "XX/XX/XXXX", text)             # DOB
text = re.sub(r"\d{4}-\d{4}-\d{4}-\d{4}", "XXXX-XXXX-XXXX-XXXX", text)  # Card

print(text)
# "SSN: XXX-XX-XXXX, DOB: XX/XX/XXXX, Card: XXXX-XXXX-XXXX-XXXX"
```

### 8. Extract Data from Structured Text (CSV-like)

```python
row = '"John Doe", "Salt Lake City, UT", "Engineer"'

fields = re.findall(r'"([^"]*)"', row)
print(fields)  # ['John Doe', 'Salt Lake City, UT', 'Engineer']
```

### 9. Convert CamelCase to snake_case

```python
def to_snake_case(name):
    s = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1_\2", name)
    s = re.sub(r"([a-z\d])([A-Z])", r"\1_\2", s)
    return s.lower()

print(to_snake_case("getUserHTTPResponse"))  # "get_user_http_response"
```

### 10. Extract Hashtags and Mentions from Social Media

```python
tweet = "Loving the #PythonRegex tutorial by @coderJane! #coding #100DaysOfCode"

hashtags = re.findall(r"#(\w+)", tweet)
mentions = re.findall(r"@(\w+)", tweet)

print(hashtags)   # ['PythonRegex', 'coding', '100DaysOfCode']
print(mentions)   # ['coderJane']
```

---

## Advanced Techniques

### Named Groups

Give your captures meaningful names instead of index numbers.

```python
pattern = r"(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})"
match = re.search(pattern, "Event on 2025-04-24")
print(match.group("year"))   # "2025"
print(match.group("month"))  # "04"
```

### Lookahead and Lookbehind

Match based on what comes before or after, without consuming it.

```python
# Find dollar amounts NOT preceded by "€"
prices = re.findall(r"(?<!\€)\$\d+", "Cost: $50, not €$30")
print(prices)  # ['$50']

# Find words followed by a colon
labels = re.findall(r"\w+(?=:)", "name: John age: 30")
print(labels)  # ['name', 'age']
```

### Non-Greedy (Lazy) Matching

Use `?` after a quantifier to match as little as possible.

```python
html = "<b>bold</b> and <i>italic</i>"

greedy  = re.findall(r"<.+>", html)    # ['<b>bold</b> and <i>italic</i>']
lazy    = re.findall(r"<.+?>", html)   # ['<b>', '</b>', '<i>', '</i>']
```

### Flags

| Flag | Effect |
|------|--------|
| `re.IGNORECASE` / `re.I` | Case-insensitive matching |
| `re.MULTILINE` / `re.M` | `^` and `$` match each line |
| `re.DOTALL` / `re.S` | `.` matches newlines too |
| `re.VERBOSE` / `re.X` | Allow comments and whitespace in pattern |

```python
pattern = re.compile(r"""
    ^(?P<proto>https?)://   # protocol
    (?P<host>[\w.-]+)       # hostname
    (?P<path>/\S*)?         # optional path
""", re.VERBOSE)

match = pattern.search("https://docs.python.org/3/library/re.html")
print(match.group("host"))  # "docs.python.org"
```

---

## What's Possible — A Summary

| Use Case | Technique |
|----------|-----------|
| Input validation (emails, phones, passwords) | `re.match` with anchored patterns |
| Data extraction from logs, HTML, CSVs | `re.findall` with capture groups |
| PII redaction and data masking | `re.sub` with replacement strings |
| Text normalization and cleanup | `re.sub` to strip or standardize |
| Tokenization and splitting | `re.split` on complex delimiters |
| Code refactoring (renaming, reformatting) | `re.sub` with backreferences |
| Web scraping and content parsing | `re.findall` on raw HTML/text |
| Search-and-highlight in text editors | Compiled patterns with `re.finditer` |

---

## Tips and Pitfalls

1. **Always use raw strings** — Write `r"\d+"` not `"\d+"` to avoid Python escaping conflicts.
2. **Don't parse HTML with regex alone** — Use `BeautifulSoup` or `lxml` for anything beyond simple extraction.
3. **Anchor your validations** — Use `^...$` when validating entire strings, otherwise partial matches slip through.
4. **Be careful with greedy quantifiers** — `.*` can swallow far more text than you expect. Use `.*?` when in doubt.
5. **Test interactively** — Tools like [regex101.com](https://regex101.com) (set to Python flavor) let you debug patterns visually.
6. **Compile for performance** — Use `re.compile()` in loops or hot paths that reuse the same pattern.

