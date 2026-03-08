    
        
        let allIssues = [];
        let currentTab = 'all';


        function handleLogin() {
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const errorEl = document.getElementById('loginError');

            if (username === 'admin' && password === 'admin123') {
                errorEl.classList.add('hidden');
                document.getElementById('loginPage').classList.add('hidden');
                document.getElementById('mainPage').classList.remove('hidden');
                loadIssues();
            } else {
                errorEl.textContent = 'Invalid username or password. Use admin / admin123.';
                errorEl.classList.remove('hidden');
            }
        }

        
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !document.getElementById('loginPage').classList.contains('hidden')) {
                handleLogin();
            }
        });

       
        function extractArray(data) {
            if (Array.isArray(data)) return data;
            if (data && Array.isArray(data.issues)) return data.issues;
            if (data && Array.isArray(data.data)) return data.data;

            if (data && typeof data === 'object') {
                const vals = Object.values(data);
                if (vals.length && Array.isArray(vals[0])) return vals[0];
            }
            return [];
        }

      
        async function loadIssues() {
            showLoading();
            try {
                const res = await fetch('https://phi-lab-server.vercel.app/api/v1/lab/issues');
                const data = await res.json();
                allIssues = extractArray(data);
                renderIssues(allIssues);
            } catch (err) {
                hideLoading();
                console.error('Failed to load issues', err);
            }
        }

        
        function renderIssues(issues) {
            hideLoading();
            const grid = document.getElementById('issuesGrid');
            const noResults = document.getElementById('noResults');

            document.getElementById('issueCount').textContent = `${issues.length} Issues`;

            if (issues.length === 0) {
                grid.classList.add('hidden');
                noResults.classList.remove('hidden');
                return;
            }

            noResults.classList.add('hidden');
            grid.classList.remove('hidden');
            grid.innerHTML = '';

            issues.forEach(issue => {
                const card = createCard(issue);
                grid.appendChild(card);
            });
        }

        
        function createCard(issue) {
            const isOpen = (issue.status || '').toLowerCase() === 'open';
            const borderColor = isOpen ? 'bg-emerald-400' : 'bg-violet-400';

            const priority = (issue.priority || '').toUpperCase();
            const priorityColor = priority === 'HIGH'
                ? 'text-white bg-red-900'
                : priority === 'MEDIUM'
                    ? 'text-white bg-orange-600'
                    : 'text-gray-500 bg-gray-50';

            const labels = issue.labels || issue.tags || [];
            const labelsHtml = labels.map(label => `
                <span class="text-[12px] font-bold text-black bg-yellow-500 px-2 py-0.5 rounded border border-red-100 uppercase ">
                    ${label}
                </span>
            `).join('');

            const createdDate = issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : '';
            const updatedDate = issue.updatedAt ? new Date(issue.updatedAt).toLocaleDateString() : '';

            const statusImg = isOpen
                ? `<img src="assets/Open-Status.png" alt="Open" class="w-5 h-5">`
                : `<img src="assets/Closed- Status .png" alt="Closed" class="w-5 h-5">`;

            const div = document.createElement('div');
            div.className = 'border border-gray-200 rounded-lg flex flex-col h-full hover:shadow-md transition cursor-pointer';
            div.innerHTML = `
                <div class="h-1.5 w-full rounded-t-lg ${borderColor}"></div>
                <div class="p-4 flex-grow">
                    <div class="flex justify-between items-start mb-3">
                        ${statusImg}
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded ${priorityColor}">${priority}</span>
                    </div>
                    <h3 class="font-bold text-gray-800 text-sm mb-2 leading-tight">${issue.title || ''}</h3>
                    <p class="text-[11px] text-gray-500 mb-4 line-clamp-2">${issue.description || ''}</p>
                    <div class="flex flex-wrap gap-1 mb-4">${labelsHtml}</div>
                </div>
                <div class="border-t border-gray-100 p-3 bg-gray-50/50 rounded-b-lg space-y-0.5">
                    <div class="flex justify-between">
                        <p class="text-[10px] text-gray-400">#${issue.id || issue._id || ''} by ${issue.author || issue.createdBy || ''}</p>
                        <p class="text-[10px] text-gray-400">${createdDate}</p>
                    </div>
                    <div class="flex justify-between">
                        <p class="text-[10px] text-gray-400">Assignee: ${issue.assignee || 'Unassigned'}</p>
                        <p class="text-[10px] text-gray-400">Updated: ${updatedDate}</p>
                    </div>
                </div>
            `;

            div.addEventListener('click', () => openModal(issue));
            return div;
        }

        // ===================== TABS =====================
        function switchTab(tab) {
            currentTab = tab;

            // Update tab button styles
            const tabs = { all: 'tabAll', open: 'tabOpen', closed: 'tabClosed' };
            Object.entries(tabs).forEach(([key, id]) => {
                const btn = document.getElementById(id);
                if (key === tab) {
                    btn.className = 'bg-[#4A00FF] text-white px-8 py-2 rounded-md font-medium';
                } else {
                    btn.className = 'text-gray-500 hover:bg-gray-100 px-8 py-2 rounded-md font-medium border border-gray-200';
                }
            });

            let filtered = allIssues;
            if (tab === 'open') {
                filtered = allIssues.filter(i => (i.status || '').toLowerCase() === 'open');
            } else if (tab === 'closed') {
                filtered = allIssues.filter(i => (i.status || '').toLowerCase() === 'closed');
            }

            renderIssues(filtered);
        }

        // ===================== SEARCH =====================
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;

        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            const q = this.value.trim();
            if (q.length === 0) {
                // Reset to current tab
                switchTab(currentTab);
                return;
            }
            searchTimeout = setTimeout(() => performSearch(q), 400);
        });

        async function performSearch(q) {
            showLoading();
            try {
                const res = await fetch(`https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q=${encodeURIComponent(q)}`);
                const data = await res.json();
                const results = extractArray(data);
                renderIssues(results);
            } catch (err) {
                hideLoading();
                console.error('Search failed', err);
            }
        }

        function handleSearch() {
            const q = searchInput.value.trim();
            if (q) performSearch(q);
        }

        // ===================== MODAL =====================
        async function openModal(issue) {
            // Fetch fresh single issue data
            try {
                const id = issue.id || issue._id;
                const res = await fetch(`https://phi-lab-server.vercel.app/api/v1/lab/issue/${id}`);
                const data = await res.json();
                const fullIssue = data.issue || data.data || data || issue;
                populateModal(fullIssue);
            } catch {
                populateModal(issue);
            }
        }

        function populateModal(issue) {
            const isOpen = (issue.status || '').toLowerCase() === 'open';

            document.getElementById('modalTitle').textContent = issue.title || '';
            document.getElementById('modalDescription').textContent = issue.description || '';
            document.getElementById('modalAuthor').textContent = issue.author || issue.createdBy || '';
            document.getElementById('modalDate').textContent = issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : '';
            document.getElementById('modalAssignee').textContent = issue.assignee || issue.author || issue.createdBy || 'Unassigned';

            // createdAt and updatedAt
            document.getElementById('modalCreatedAt').textContent = issue.createdAt
                ? new Date(issue.createdAt).toLocaleString() : '—';
            document.getElementById('modalUpdatedAt').textContent = issue.updatedAt
                ? new Date(issue.updatedAt).toLocaleString() : '—';

            const statusBadge = document.getElementById('modalStatusBadge');
            statusBadge.textContent = issue.status || '';
            statusBadge.className = `px-3 py-0.5 rounded-full text-xs font-medium ${isOpen ? 'bg-emerald-500 text-white' : 'bg-violet-500 text-white'}`;

            const priority = (issue.priority || '').toUpperCase();
            const priorityEl = document.getElementById('modalPriority');
            priorityEl.textContent = priority;
            priorityEl.className = `px-4 py-1.5 rounded-full text-xs font-bold tracking-tight ${priority === 'HIGH' ? 'bg-red-800 text-white' :
                priority === 'MEDIUM' ? 'bg-orange-600 text-white' :
                    'bg-gray-300 text-gray-700'
                }`;

            const labels = issue.labels || issue.tags || [];
            document.getElementById('modalLabels').innerHTML = labels.map(label => `
                <span class="flex items-center gap-1 bg-yellow-500 text-black border border-red-100 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                    ${label}
                </span>
            `).join('');

            document.getElementById('issueModal').classList.remove('hidden');
        }

        function closeModal() {
            document.getElementById('issueModal').classList.add('hidden');
        }

        // Close modal on backdrop click
        document.getElementById('issueModal').addEventListener('click', function (e) {
            if (e.target === this) closeModal();
        });

        // ===================== LOADING =====================
        function showLoading() {
            document.getElementById('loadingSpinner').classList.remove('hidden');
            document.getElementById('issuesGrid').classList.add('hidden');
            document.getElementById('noResults').classList.add('hidden');
        }

        function hideLoading() {
            document.getElementById('loadingSpinner').classList.add('hidden');
        }
    