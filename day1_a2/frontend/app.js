document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const fileUpload = document.getElementById('fileUpload');
    const resultsSection = document.getElementById('resultsSection');
    const resultsGrid = document.getElementById('resultsGrid');
    const textareas = document.querySelectorAll('textarea');
    const spinner = analyzeBtn.querySelector('.spinner');
    const btnText = analyzeBtn.querySelector('.btn-text');

    let currentResults = [];

    // File Upload Handler
    fileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            const lines = content.split('\n').filter(line => line.trim() !== '');
            
            // Fill textareas with lines from file
            textareas.forEach((textarea, index) => {
                if (lines[index]) {
                    textarea.value = lines[index].trim();
                } else {
                    textarea.value = '';
                }
            });
        };
        reader.readAsText(file);
    });

    // Analyze Button Handler
    analyzeBtn.addEventListener('click', async () => {
        const prompts = Array.from(textareas)
            .map(t => t.value.trim())
            .filter(p => p !== '');

        if (prompts.length === 0) {
            alert('Please enter at least one prompt.');
            return;
        }

        // UI Loading State
        analyzeBtn.disabled = true;
        spinner.classList.remove('hidden');
        btnText.textContent = 'Optimizing...';
        resultsSection.classList.add('hidden');

        try {
            const response = await fetch('/api/improve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompts })
            });

            if (!response.ok) throw new Error('Failed to fetch improvements');

            const data = await response.json();
            currentResults = data.results;
            renderResults(data.results);
            resultsSection.classList.remove('hidden');
            resultsSection.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error(error);
            alert('An error occurred during improvement. Check console for details.');
        } finally {
            analyzeBtn.disabled = false;
            spinner.classList.add('hidden');
            btnText.textContent = 'Improve Prompts';
        }
    });

    // Download Button Handler
    downloadBtn.addEventListener('click', async () => {
        if (currentResults.length === 0) return;

        try {
            const response = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ results: currentResults })
            });

            if (!response.ok) throw new Error('Failed to generate report');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'prompt_evaluation_report.md';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            alert('Error downloading report.');
        }
    });

    function renderResults(results) {
        resultsGrid.innerHTML = '';
        results.forEach(res => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.innerHTML = `
                <div class="result-header">Prompt Analysis #${res.index}</div>
                <div class="result-body">
                    <div class="comparison-box">
                        <div class="box box-original">
                            <span class="badge badge-red">Original</span>
                            <p>${escapeHtml(res.original)}</p>
                        </div>
                        <div class="box box-improved">
                            <span class="badge badge-green">Improved</span>
                            <p>${escapeHtml(res.improved)}</p>
                        </div>
                    </div>
                    <div class="explanation">
                        <strong>💡 Explanation:</strong> ${escapeHtml(res.explanation)}
                    </div>
                </div>
            `;
            resultsGrid.appendChild(card);
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
