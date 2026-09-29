const translateBtn = document.getElementById('translateBtn');
const cppCodeInput = document.getElementById('cppCode');
const errorBox = document.getElementById('errorBox');
const outputBox = document.getElementById('outputBox');
const explanationText = document.getElementById('explanationText');

// Translation Dictionary Rules
const cppDictionary = [
  { pattern: /#include\s+<iostream>/, explain: "• Include standard input/output library" },
  { pattern: /int\s+main\s*\(\)/, explain: "• Main entry point of program" },
  { pattern: /std::cout\s*<<\s*"(.*?)"\s*;\s*/, explain: (m) => `• Print "${m[1]}" to console` },
  { pattern: /int\s+([a-zA-Z_]\w*)\s*=\s*(.*?);/, explain: (m) => `• Set integer variable '${m[1]}' to ${m[2]}` },
  { pattern: /return\s+0;/, explain: "• End program successfully" }
];

translateBtn.addEventListener('click', async () => {
  const code = cppCodeInput.value.trim();
  if (!code) return;

  errorBox.classList.add('hidden');
  outputBox.classList.add('hidden');
  translateBtn.innerText = "Checking syntax...";

  try {
    // 1. Check syntax via Godbolt API
    const response = await fetch('https://godbolt.org/api/compiler/g132/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ source: code, options: { userArguments: "" } })
    });

    const data = await response.json();

    // 2. Process compiler output for first error
    if (data.stderr && data.stderr.length > 0) {
      const firstError = data.stderr.find(item => item.text.includes('error:'));
      if (firstError) {
        errorBox.innerHTML = `<strong>Syntax Error (Line ${firstError.line || '?'})</strong><br>${firstError.text}`;
        errorBox.classList.remove('hidden');
        translateBtn.innerText = "Check & Translate";
        return;
      }
    }

    // 3. If no syntax error, run line-by-line dictionary translation
    const lines = code.split('\n');
    const results = [];

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;

      let matched = false;
      for (let rule of cppDictionary) {
        const match = trimmed.match(rule.pattern);
        if (match) {
          results.push(typeof rule.explain === 'function' ? rule.explain(match) : rule.explain);
          matched = true;
          break;
        }
      }
      if (!matched) results.push(`• Execute: ${trimmed}`);
    }

    explanationText.textContent = results.join('\n');
    outputBox.classList.remove('hidden');

  } catch (err) {
    errorBox.textContent = "Network error connecting to compiler API.";
    errorBox.classList.remove('hidden');
  }

  translateBtn.innerText = "Check & Translate";
});