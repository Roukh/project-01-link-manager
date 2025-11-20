//Supabase Integration
// Note: Supabase library is loaded from CDN in index.html
const supabaseUrl = 'https://eshmrgmtwghuhmlrbmmo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaG1yZ210d2dodWhtbHJibW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDExMDEsImV4cCI6MjA3OTA3NzEwMX0.ABag9OiQsvz898t6AK6EuJ2M7hmvaJn67lBvV8XVADo'
const { createClient } = window.supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey)



// Link Manager Application
class LinkManager {
    constructor() {
        this.links = [];
        this.folders = [];
        this.currentFilter = 'all';
        this.currentFolderId = null; // null means root "Your Links"
        this.currentSortBy = 'date'; // date, alpha, items
        this.editingLinkId = null;
        this.editingFolderId = null;
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Link Manager...');
        console.log('📡 Supabase URL:', supabaseUrl);

        // Show loading state
        const container = document.getElementById('linksContainer');
        container.innerHTML = '<div class="empty-state"><p>Loading from database...</p></div>';

        // Load folders and links from database
        this.folders = await this.loadFolders();
        this.links = await this.loadLinks();
        console.log('📦 Loaded:', this.links.length, 'links,', this.folders.length, 'folders');

        // Event Listeners
        document.getElementById('linkForm').addEventListener('submit', (e) => this.handleAddLink(e));
        document.getElementById('createFolderBtn').addEventListener('click', () => this.openFolderModal());
        document.getElementById('createFolderForm').addEventListener('submit', (e) => this.handleCreateFolder(e));
        document.getElementById('editFolderForm').addEventListener('submit', (e) => this.handleEditFolder(e));
        document.getElementById('editLinkForm').addEventListener('submit', (e) => this.handleEditLink(e));
        document.getElementById('moveLinkForm').addEventListener('submit', (e) => this.handleMoveLink(e));
        document.getElementById('sortBy').addEventListener('change', (e) => this.handleSortChange(e));

        // Modal close buttons
        document.getElementById('closeEditModal').addEventListener('click', () => this.closeEditModal());
        document.getElementById('cancelEdit').addEventListener('click', () => this.closeEditModal());
        document.getElementById('closeFolderModal').addEventListener('click', () => this.closeFolderModal());
        document.getElementById('cancelFolder').addEventListener('click', () => this.closeFolderModal());
        document.getElementById('closeEditFolderModal').addEventListener('click', () => this.closeEditFolderModal());
        document.getElementById('cancelEditFolder').addEventListener('click', () => this.closeEditFolderModal());
        document.getElementById('closeMoveLinkModal').addEventListener('click', () => this.closeMoveLinkModal());
        document.getElementById('cancelMoveLink').addEventListener('click', () => this.closeMoveLinkModal());

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeEditModal();
                this.closeFolderModal();
                this.closeEditFolderModal();
                this.closeMoveLinkModal();
            }
        });

        // Initial render
        this.populateFolderDropdowns();
        this.renderBreadcrumbs();
        this.renderLinks();
        this.renderFilterButtons();
        this.updateLinkCount();

        console.log('✅ Link Manager initialized successfully');
    }

    // ============ FOLDER OPERATIONS ============

    async loadFolders() {
        console.log('Fetching folders from Supabase...');
        try {
            const { data, error } = await supabase
                .from('folders')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) {
                console.error('❌ Supabase error:', error);
                return [];
            }

            console.log('✅ Successfully fetched', data?.length || 0, 'folders');
            return data || [];
        } catch (err) {
            console.error('❌ Unexpected error:', err);
            return [];
        }
    }

    async createFolder(name, description = '', parentFolderId = null) {
        console.log('➕ Creating folder:', name);
        try {
            const { data, error } = await supabase
                .from('folders')
                .insert([{
                    name: name,
                    description: description,
                    parent_folder_id: parentFolderId
                }])
                .select();

            if (error) {
                console.error('❌ Error creating folder:', error);
                return null;
            }

            console.log('✅ Folder created successfully:', data[0]);
            return data[0];
        } catch (err) {
            console.error('❌ Unexpected error creating folder:', err);
            return null;
        }
    }

    async updateFolder(folderId, updates) {
        console.log('✏️ Updating folder:', folderId);
        try {
            const { data, error } = await supabase
                .from('folders')
                .update(updates)
                .eq('id', folderId)
                .select();

            if (error) {
                console.error('❌ Error updating folder:', error);
                return null;
            }

            console.log('✅ Folder updated successfully:', data[0]);
            return data[0];
        } catch (err) {
            console.error('❌ Unexpected error updating folder:', err);
            return null;
        }
    }

    async deleteFolder(folderId) {
        console.log('🗑️ Deleting folder:', folderId);
        try {
            const { error } = await supabase
                .from('folders')
                .delete()
                .eq('id', folderId);

            if (error) {
                console.error('❌ Error deleting folder:', error);
                return false;
            }

            console.log('✅ Folder deleted successfully');
            return true;
        } catch (err) {
            console.error('❌ Unexpected error deleting folder:', err);
            return false;
        }
    }

    // Get folders in a specific parent (null = root)
    getFoldersInParent(parentId = null) {
        return this.folders.filter(f => f.parent_folder_id === parentId);
    }

    // Get folder path for breadcrumbs
    getFolderPath(folderId) {
        if (!folderId) return [];

        const path = [];
        let currentId = folderId;

        while (currentId) {
            const folder = this.folders.find(f => f.id === currentId);
            if (!folder) break;
            path.unshift(folder);
            currentId = folder.parent_folder_id;
        }

        return path;
    }

    // Get item count for a folder (links + subfolders)
    getFolderItemCount(folderId) {
        const links = this.links.filter(l => l.folder_id === folderId).length;
        const subfolders = this.folders.filter(f => f.parent_folder_id === folderId).length;
        return links + subfolders;
    }

    // ============ LINK OPERATIONS ============

    async loadLinks() {
        console.log('🔍 Fetching links from Supabase...');
        try {
            const { data, error } = await supabase
                .from('links')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Supabase error:', error);
                this.showDatabaseError('Failed to load links from database. Check console for details.', error);
                return [];
            }

            console.log('✅ Successfully fetched', data?.length || 0, 'links');
            return data || [];
        } catch (err) {
            console.error('❌ Unexpected error:', err);
            this.showDatabaseError('Connection error. Make sure you created the database table.', err);
            return [];
        }
    }

    async addLinkToDatabase(link) {
        console.log('➕ Adding link to database:', link.title);
        try {
            const { data, error } = await supabase
                .from('links')
                .insert([{
                    url: link.url,
                    title: link.title,
                    tags: link.tags,
                    description: link.description,
                    folder_id: link.folderId,
                    created_at: link.createdAt
                }])
                .select();

            if (error) {
                console.error('❌ Error adding link:', error);
                return null;
            }

            console.log('✅ Link added successfully:', data[0]);
            return data[0];
        } catch (err) {
            console.error('❌ Unexpected error adding link:', err);
            return null;
        }
    }

    async updateLink(id, updates) {
        console.log('✏️ Updating link:', id);
        try {
            const { data, error } = await supabase
                .from('links')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                console.error('❌ Error updating link:', error);
                return null;
            }

            console.log('✅ Link updated successfully:', data[0]);
            return data[0];
        } catch (err) {
            console.error('❌ Unexpected error updating link:', err);
            return null;
        }
    }

    async deleteLink(id) {
        if (confirm('Are you sure you want to delete this link?')) {
            try {
                const { error } = await supabase
                    .from('links')
                    .delete()
                    .eq('id', id);

                if (error) {
                    console.error('Error deleting link from Supabase:', error);
                    this.showNotification('Failed to delete link. Please try again.', 'error');
                    return;
                }

                // Remove from local links array
                this.links = this.links.filter(link => link.id !== id);

                this.renderLinks();
                this.renderFilterButtons();
                this.updateLinkCount();
                this.showNotification('Link deleted successfully!');
            } catch (err) {
                console.error('Unexpected error deleting link:', err);
                this.showNotification('Failed to delete link. Please try again.', 'error');
            }
        }
    }

    // ============ EVENT HANDLERS ============

    async handleAddLink(e) {
        e.preventDefault();

        const url = document.getElementById('url').value.trim();
        const title = document.getElementById('title').value.trim();
        const tagsInput = document.getElementById('tags').value.trim();
        const description = document.getElementById('description').value.trim();
        const folderSelect = document.getElementById('folder').value;

        // Parse tags
        const tags = tagsInput
            .split(',')
            .map(tag => tag.trim().toLowerCase())
            .filter(tag => tag.length > 0);

        // Create link object
        const link = {
            url,
            title,
            tags,
            description,
            folderId: folderSelect ? parseInt(folderSelect) : null,
            createdAt: new Date().toISOString()
        };

        // Add to Supabase database
        const savedLink = await this.addLinkToDatabase(link);

        if (savedLink) {
            // Add to local links array
            this.links.unshift(savedLink);

            // Clear form
            document.getElementById('linkForm').reset();

            // Re-render
            this.renderLinks();
            this.renderFilterButtons();
            this.updateLinkCount();

            // Show success feedback
            this.showNotification('Link added successfully!');
        } else {
            this.showNotification('Failed to add link. Please try again.', 'error');
        }
    }

    async handleCreateFolder(e) {
        e.preventDefault();

        const name = document.getElementById('folderName').value.trim();
        const description = document.getElementById('folderDescription').value.trim();
        const parentSelect = document.getElementById('parentFolder').value;
        const parentId = parentSelect ? parseInt(parentSelect) : null;

        const newFolder = await this.createFolder(name, description, parentId);

        if (newFolder) {
            this.folders.push(newFolder);
            this.closeFolderModal();
            this.populateFolderDropdowns();
            this.renderLinks();
            this.showNotification('Folder created successfully!');
        } else {
            this.showNotification('Failed to create folder. Please try again.', 'error');
        }
    }

    openEditModal(link) {
        this.editingLinkId = link.id;
        document.getElementById('editUrl').value = link.url;
        document.getElementById('editTitle').value = link.title;
        document.getElementById('editTags').value = link.tags.join(', ');
        document.getElementById('editDescription').value = link.description || '';
        document.getElementById('editModal').style.display = 'flex';
    }

    closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
        this.editingLinkId = null;
        document.getElementById('editLinkForm').reset();
    }

    async handleEditLink(e) {
        e.preventDefault();

        const url = document.getElementById('editUrl').value.trim();
        const title = document.getElementById('editTitle').value.trim();
        const tagsInput = document.getElementById('editTags').value.trim();
        const description = document.getElementById('editDescription').value.trim();

        const tags = tagsInput
            .split(',')
            .map(tag => tag.trim().toLowerCase())
            .filter(tag => tag.length > 0);

        const updates = { url, title, tags, description };
        const updatedLink = await this.updateLink(this.editingLinkId, updates);

        if (updatedLink) {
            // Update local array
            const index = this.links.findIndex(l => l.id === this.editingLinkId);
            if (index !== -1) {
                this.links[index] = updatedLink;
            }

            this.closeEditModal();
            this.renderLinks();
            this.renderFilterButtons();
            this.showNotification('Link updated successfully!');
        } else {
            this.showNotification('Failed to update link. Please try again.', 'error');
        }
    }

    openFolderModal() {
        document.getElementById('folderModal').style.display = 'flex';
    }

    closeFolderModal() {
        document.getElementById('folderModal').style.display = 'none';
        document.getElementById('createFolderForm').reset();
    }

    openEditFolderModal(folder) {
        this.editingFolderId = folder.id;
        document.getElementById('editFolderName').value = folder.name;
        document.getElementById('editFolderDescription').value = folder.description || '';

        // Populate parent folder dropdown, excluding current folder and its descendants
        const parentSelect = document.getElementById('editParentFolder');
        const folderOptions = this.generateFolderOptionsExcluding(folder.id);
        parentSelect.innerHTML = '<option value="">Your Links (Root)</option>' + folderOptions;

        // Set current parent
        parentSelect.value = folder.parent_folder_id || '';

        document.getElementById('editFolderModal').style.display = 'flex';
    }

    closeEditFolderModal() {
        document.getElementById('editFolderModal').style.display = 'none';
        this.editingFolderId = null;
        document.getElementById('editFolderForm').reset();
    }

    async handleEditFolder(e) {
        e.preventDefault();

        const name = document.getElementById('editFolderName').value.trim();
        const description = document.getElementById('editFolderDescription').value.trim();
        const parentSelect = document.getElementById('editParentFolder').value;
        const parentId = parentSelect ? parseInt(parentSelect) : null;

        const updates = {
            name: name,
            description: description,
            parent_folder_id: parentId
        };

        const updatedFolder = await this.updateFolder(this.editingFolderId, updates);

        if (updatedFolder) {
            // Update local array
            const index = this.folders.findIndex(f => f.id === this.editingFolderId);
            if (index !== -1) {
                this.folders[index] = updatedFolder;
            }

            this.closeEditFolderModal();
            this.populateFolderDropdowns();
            this.renderBreadcrumbs();
            this.renderLinks();
            this.showNotification('Folder updated successfully!');
        } else {
            this.showNotification('Failed to update folder. Please try again.', 'error');
        }
    }

    openMoveLinkModal(link) {
        this.editingLinkId = link.id;

        // Populate folder dropdown
        const folderSelect = document.getElementById('moveLinkFolder');
        const folderOptions = this.generateFolderOptions();
        folderSelect.innerHTML = '<option value="">Your Links (Root)</option>' + folderOptions;

        // Set current folder
        folderSelect.value = link.folder_id || '';

        document.getElementById('moveLinkModal').style.display = 'flex';
    }

    closeMoveLinkModal() {
        document.getElementById('moveLinkModal').style.display = 'none';
        this.editingLinkId = null;
    }

    async handleMoveLink(e) {
        e.preventDefault();

        const folderSelect = document.getElementById('moveLinkFolder').value;
        const folderId = folderSelect ? parseInt(folderSelect) : null;

        await this.moveLinkToFolder(this.editingLinkId, folderId);
        this.closeMoveLinkModal();
    }

    async moveLinkToFolder(linkId, folderId) {
        const updatedLink = await this.updateLink(linkId, { folder_id: folderId });

        if (updatedLink) {
            // Update local array
            const index = this.links.findIndex(l => l.id === linkId);
            if (index !== -1) {
                this.links[index] = updatedLink;
            }

            this.renderLinks();

            const folderName = folderId
                ? this.folders.find(f => f.id === folderId)?.name
                : 'Your Links';
            this.showNotification(`Link moved to ${folderName}!`);
        } else {
            this.showNotification('Failed to move link. Please try again.', 'error');
        }
    }

    handleSortChange(e) {
        this.currentSortBy = e.target.value;
        this.renderLinks();
    }

    navigateToFolder(folderId) {
        this.currentFolderId = folderId;
        this.renderBreadcrumbs();
        this.renderLinks();
    }

    // ============ RENDERING ============

    populateFolderDropdowns() {
        // Populate the folder selector in "Add Link" form
        const folderSelect = document.getElementById('folder');
        const parentSelect = document.getElementById('parentFolder');

        const folderOptions = this.generateFolderOptions();

        folderSelect.innerHTML = '<option value="">Your Links (Root)</option>' + folderOptions;
        parentSelect.innerHTML = '<option value="">Your Links (Root)</option>' + folderOptions;
    }

    generateFolderOptions(parentId = null, prefix = '') {
        const folders = this.getFoldersInParent(parentId);
        let html = '';

        folders.forEach(folder => {
            html += `<option value="${folder.id}">${prefix}${folder.name}</option>`;
            // Recursively add subfolders
            html += this.generateFolderOptions(folder.id, prefix + '  ');
        });

        return html;
    }

    // Generate folder options excluding a specific folder and its descendants
    generateFolderOptionsExcluding(excludeId, parentId = null, prefix = '') {
        const folders = this.getFoldersInParent(parentId);
        let html = '';

        folders.forEach(folder => {
            if (folder.id !== excludeId) {
                html += `<option value="${folder.id}">${prefix}${folder.name}</option>`;
                // Recursively add subfolders (they will also be excluded if they're descendants)
                html += this.generateFolderOptionsExcluding(excludeId, folder.id, prefix + '  ');
            }
        });

        return html;
    }

    renderBreadcrumbs() {
        const breadcrumbsContainer = document.getElementById('breadcrumbs');

        if (!this.currentFolderId) {
            breadcrumbsContainer.innerHTML = '';
            return;
        }

        const path = this.getFolderPath(this.currentFolderId);

        let html = '<span class="breadcrumb-item" data-folder-id="">Your Links</span>';

        path.forEach(folder => {
            html += ` <span class="breadcrumb-separator">/</span> `;
            html += `<span class="breadcrumb-item" data-folder-id="${folder.id}">${this.escapeHtml(folder.name)}</span>`;
        });

        breadcrumbsContainer.innerHTML = html;

        // Add click handlers
        document.querySelectorAll('.breadcrumb-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const folderId = e.target.getAttribute('data-folder-id');
                this.navigateToFolder(folderId ? parseInt(folderId) : null);
            });
        });
    }

    getSortedItems() {
        // Get folders and links in current location
        const folders = this.getFoldersInParent(this.currentFolderId);
        const links = this.links.filter(l => {
            const folderMatch = l.folder_id === this.currentFolderId;
            const tagMatch = this.currentFilter === 'all' || l.tags.includes(this.currentFilter);
            return folderMatch && tagMatch;
        });

        // Sort based on current sort option
        const sortedFolders = [...folders];
        const sortedLinks = [...links];

        if (this.currentSortBy === 'alpha') {
            sortedFolders.sort((a, b) => a.name.localeCompare(b.name));
            sortedLinks.sort((a, b) => a.title.localeCompare(b.title));
        } else if (this.currentSortBy === 'items') {
            sortedFolders.sort((a, b) => this.getFolderItemCount(b.id) - this.getFolderItemCount(a.id));
            // Links don't have item count, keep by date
        } else { // date
            sortedFolders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            sortedLinks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        return { folders: sortedFolders, links: sortedLinks };
    }

    renderLinks() {
        const container = document.getElementById('linksContainer');
        const { folders, links } = this.getSortedItems();

        if (folders.length === 0 && links.length === 0) {
            const message = this.currentFilter === 'all'
                ? 'No items here yet.'
                : `No links found with tag "${this.currentFilter}"`;

            container.innerHTML = `
                <div class="empty-state">
                    <p>${message}</p>
                </div>
            `;
            return;
        }

        let html = '';

        // Render folders first
        folders.forEach(folder => {
            html += this.createFolderCard(folder);
        });

        // Then render links
        links.forEach(link => {
            html += this.createLinkCard(link);
        });

        container.innerHTML = html;

        // Add event listeners for link actions
        this.attachLinkEventListeners();
        this.attachFolderEventListeners();
    }

    createFolderCard(folder) {
        const itemCount = this.getFolderItemCount(folder.id);

        const descriptionHTML = folder.description
            ? `<p class="folder-description">${this.escapeHtml(folder.description)}</p>`
            : '';

        return `
            <div class="link-card folder-card" data-folder-id="${folder.id}" data-droppable="true">
                <div class="card-menu">
                    <button class="menu-btn" data-folder-id="${folder.id}">⋮</button>
                    <div class="menu-dropdown">
                        <button class="menu-item edit-folder-btn" data-folder-id="${folder.id}">Edit</button>
                        <button class="menu-item delete-folder-btn" data-folder-id="${folder.id}">Delete</button>
                    </div>
                </div>
                <div class="folder-icon">📁</div>
                <div class="link-card-header">
                    <h3 class="link-card-title">${this.escapeHtml(folder.name)}</h3>
                    <p class="folder-item-count">${itemCount} item${itemCount !== 1 ? 's' : ''}</p>
                </div>
                ${descriptionHTML}
            </div>
        `;
    }

    createLinkCard(link) {
        const tagsHTML = link.tags.length > 0
            ? link.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
            : '<span class="tag">untagged</span>';

        const descriptionHTML = link.description
            ? `<p class="link-card-description">${this.escapeHtml(link.description)}</p>`
            : '';

        return `
            <div class="link-card" draggable="true" data-link-id="${link.id}">
                <div class="card-menu">
                    <button class="menu-btn" data-link-id="${link.id}">⋮</button>
                    <div class="menu-dropdown">
                        <button class="menu-item edit-btn" data-link-id="${link.id}">Edit</button>
                        <button class="menu-item move-btn" data-link-id="${link.id}">Move to Folder</button>
                        <button class="menu-item delete-btn" data-link-id="${link.id}">Delete</button>
                    </div>
                </div>
                <div class="link-card-header">
                    <h3 class="link-card-title">${this.escapeHtml(link.title)}</h3>
                    <a href="${link.url}" target="_blank" class="link-card-url">${this.truncateUrl(link.url)}</a>
                </div>
                ${descriptionHTML}
                <div class="link-card-tags">
                    ${tagsHTML}
                </div>
                <div class="link-card-actions">
                    <button class="btn-visit" data-url="${link.url}">Visit</button>
                </div>
            </div>
        `;
    }

    attachLinkEventListeners() {
        // Menu toggle
        document.querySelectorAll('.card-menu .menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = e.target.nextElementSibling;

                // Close all other dropdowns
                document.querySelectorAll('.menu-dropdown').forEach(d => {
                    if (d !== dropdown) d.classList.remove('show');
                });

                dropdown.classList.toggle('show');
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.card-menu')) {
                document.querySelectorAll('.menu-dropdown').forEach(d => {
                    d.classList.remove('show');
                });
            }
        });

        // Edit button
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const linkId = parseInt(e.target.getAttribute('data-link-id'));
                const link = this.links.find(l => l.id === linkId);
                if (link) this.openEditModal(link);
            });
        });

        // Delete button
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-link-id'));
                this.deleteLink(id);
            });
        });

        // Visit button
        document.querySelectorAll('.btn-visit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.target.getAttribute('data-url');
                window.open(url, '_blank');
            });
        });

        // Move button
        document.querySelectorAll('.move-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const linkId = parseInt(e.target.getAttribute('data-link-id'));
                const link = this.links.find(l => l.id === linkId);
                if (link) this.openMoveLinkModal(link);
            });
        });

        // Drag and drop for links
        document.querySelectorAll('.link-card[draggable="true"]').forEach(card => {
            card.addEventListener('dragstart', (e) => {
                const linkId = e.target.getAttribute('data-link-id');
                e.dataTransfer.setData('text/plain', linkId);
                e.dataTransfer.effectAllowed = 'move';
                e.target.classList.add('dragging');
            });

            card.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
            });
        });
    }

    attachFolderEventListeners() {
        // Folder card click (navigate into folder)
        document.querySelectorAll('.folder-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.card-menu')) {
                    const folderId = parseInt(card.getAttribute('data-folder-id'));
                    this.navigateToFolder(folderId);
                }
            });
        });

        // Edit folder button
        document.querySelectorAll('.edit-folder-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const folderId = parseInt(e.target.getAttribute('data-folder-id'));
                const folder = this.folders.find(f => f.id === folderId);
                if (folder) this.openEditFolderModal(folder);
            });
        });

        // Delete folder button
        document.querySelectorAll('.delete-folder-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const folderId = parseInt(e.target.getAttribute('data-folder-id'));

                if (confirm('Delete this folder? All subfolders will be deleted, and links inside will move to Your Links.')) {
                    const success = await this.deleteFolder(folderId);
                    if (success) {
                        this.folders = this.folders.filter(f => f.id !== folderId);
                        await this.reloadData();
                        this.showNotification('Folder deleted successfully!');
                    } else {
                        this.showNotification('Failed to delete folder.', 'error');
                    }
                }
            });
        });

        // Drag and drop handlers for folders
        document.querySelectorAll('.folder-card[data-droppable="true"]').forEach(card => {
            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                card.classList.add('drag-over');
            });

            card.addEventListener('dragleave', (e) => {
                if (e.target === card || !card.contains(e.relatedTarget)) {
                    card.classList.remove('drag-over');
                }
            });

            card.addEventListener('drop', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                card.classList.remove('drag-over');

                const linkId = parseInt(e.dataTransfer.getData('text/plain'));
                const folderId = parseInt(card.getAttribute('data-folder-id'));

                await this.moveLinkToFolder(linkId, folderId);
            });
        });
    }

    async reloadData() {
        this.folders = await this.loadFolders();
        this.links = await this.loadLinks();
        this.populateFolderDropdowns();
        this.renderBreadcrumbs();
        this.renderLinks();
        this.updateLinkCount();
    }

    // ============ UTILITIES ============

    getAllTags() {
        const tagsSet = new Set();
        this.links.forEach(link => {
            link.tags.forEach(tag => tagsSet.add(tag));
        });
        return Array.from(tagsSet).sort();
    }

    renderFilterButtons() {
        const tagFiltersContainer = document.getElementById('tagFilters');
        const allTags = this.getAllTags();

        if (allTags.length === 0) {
            tagFiltersContainer.innerHTML = '';
            return;
        }

        const buttons = allTags.map(tag => {
            const isActive = this.currentFilter === tag ? 'active' : '';
            return `<button class="filter-btn ${isActive}" data-tag="${tag}">${tag}</button>`;
        }).join('');

        tagFiltersContainer.innerHTML = buttons;

        // Add event listeners to filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tag = e.target.getAttribute('data-tag');
                this.setFilter(tag);
            });
        });
    }

    setFilter(tag) {
        this.currentFilter = tag;

        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tag') === tag) {
                btn.classList.add('active');
            }
        });

        this.renderLinks();
    }

    updateLinkCount() {
        const count = this.links.length;
        document.getElementById('linkCount').textContent = `(${count})`;
    }

    truncateUrl(url) {
        const maxLength = 50;
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength) + '...';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.textContent = message;

        const backgroundColor = type === 'error' ? '#ef4444' : '#10b981';

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: ${backgroundColor};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                document.body.removeChild(notification);
                document.head.removeChild(style);
            }, 300);
        }, 3000);
    }

    showDatabaseError(message, error) {
        const container = document.getElementById('linksContainer');
        container.innerHTML = `
            <div class="error-state" style="
                background-color: #fee2e2;
                border: 2px solid #ef4444;
                border-radius: 8px;
                padding: 2rem;
                text-align: center;
                color: #991b1b;
            ">
                <h3 style="margin: 0 0 1rem 0; color: #991b1b;">⚠️ Database Error</h3>
                <p style="margin: 0 0 1rem 0;"><strong>${message}</strong></p>
                <details style="text-align: left; background: white; padding: 1rem; border-radius: 4px; margin-top: 1rem;">
                    <summary style="cursor: pointer; font-weight: bold; margin-bottom: 0.5rem;">Error Details</summary>
                    <pre style="overflow: auto; font-size: 0.875rem;">${JSON.stringify(error, null, 2)}</pre>
                </details>
                <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #ef4444;">
                    <p style="margin: 0 0 0.5rem 0; font-weight: bold;">Troubleshooting Checklist:</p>
                    <ul style="text-align: left; margin: 0.5rem 0;">
                        <li>Did you create the 'links' and 'folders' tables in Supabase?</li>
                        <li>Did you set up the RLS policies?</li>
                        <li>Is your Supabase URL and anon key correct?</li>
                        <li>Are you running this on a local server (not file://)?</li>
                    </ul>
                </div>
            </div>
        `;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LinkManager();
});
