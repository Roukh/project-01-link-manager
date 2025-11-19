// Link Manager Application
class LinkManager {
    constructor() {
        this.links = this.loadLinks();
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        // Event Listeners
        document.getElementById('linkForm').addEventListener('submit', (e) => this.handleAddLink(e));

        // Initial render
        this.renderLinks();
        this.renderFilterButtons();
        this.updateLinkCount();
    }

    // Load links from localStorage
    loadLinks() {
        const stored = localStorage.getItem('links');
        return stored ? JSON.parse(stored) : [];
    }

    // Save links to localStorage
    saveLinks() {
        localStorage.setItem('links', JSON.stringify(this.links));
    }

    // Handle form submission
    handleAddLink(e) {
        e.preventDefault();

        const url = document.getElementById('url').value.trim();
        const title = document.getElementById('title').value.trim();
        const tagsInput = document.getElementById('tags').value.trim();

        // Parse tags
        const tags = tagsInput
            .split(',')
            .map(tag => tag.trim().toLowerCase())
            .filter(tag => tag.length > 0);

        // Create link object
        const link = {
            id: Date.now(),
            url,
            title,
            tags,
            createdAt: new Date().toISOString()
        };

        // Add to links array
        this.links.unshift(link);
        this.saveLinks();

        // Clear form
        document.getElementById('linkForm').reset();

        // Re-render
        this.renderLinks();
        this.renderFilterButtons();
        this.updateLinkCount();

        // Show success feedback
        this.showNotification('Link added successfully!');
    }

    // Get all unique tags from links
    getAllTags() {
        const tagsSet = new Set();
        this.links.forEach(link => {
            link.tags.forEach(tag => tagsSet.add(tag));
        });
        return Array.from(tagsSet).sort();
    }

    // Render filter buttons
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

    // Set current filter
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

    // Get filtered links
    getFilteredLinks() {
        if (this.currentFilter === 'all') {
            return this.links;
        }
        return this.links.filter(link => link.tags.includes(this.currentFilter));
    }

    // Render links
    renderLinks() {
        const container = document.getElementById('linksContainer');
        const filteredLinks = this.getFilteredLinks();

        if (filteredLinks.length === 0) {
            const message = this.currentFilter === 'all'
                ? 'No links saved yet. Add your first link above!'
                : `No links found with tag "${this.currentFilter}"`;

            container.innerHTML = `
                <div class="empty-state">
                    <p>${message}</p>
                </div>
            `;
            return;
        }

        const linksHTML = filteredLinks.map(link => this.createLinkCard(link)).join('');
        container.innerHTML = linksHTML;

        // Add delete event listeners
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                this.deleteLink(id);
            });
        });

        // Add visit event listeners
        document.querySelectorAll('.btn-visit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.target.getAttribute('data-url');
                window.open(url, '_blank');
            });
        });
    }

    // Create HTML for a single link card
    createLinkCard(link) {
        const tagsHTML = link.tags.length > 0
            ? link.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
            : '<span class="tag">untagged</span>';

        return `
            <div class="link-card">
                <div class="link-card-header">
                    <h3 class="link-card-title">${this.escapeHtml(link.title)}</h3>
                    <a href="${link.url}" target="_blank" class="link-card-url">${this.truncateUrl(link.url)}</a>
                </div>
                <div class="link-card-tags">
                    ${tagsHTML}
                </div>
                <div class="link-card-actions">
                    <button class="btn-visit" data-url="${link.url}">Visit</button>
                    <button class="btn-delete" data-id="${link.id}">Delete</button>
                </div>
            </div>
        `;
    }

    // Delete a link
    deleteLink(id) {
        if (confirm('Are you sure you want to delete this link?')) {
            this.links = this.links.filter(link => link.id !== id);
            this.saveLinks();
            this.renderLinks();
            this.renderFilterButtons();
            this.updateLinkCount();
            this.showNotification('Link deleted successfully!');
        }
    }

    // Update link count display
    updateLinkCount() {
        const count = this.links.length;
        document.getElementById('linkCount').textContent = `(${count})`;
    }

    // Truncate URL for display
    truncateUrl(url) {
        const maxLength = 50;
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength) + '...';
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Show notification (simple feedback)
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #10b981;
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LinkManager();
});
