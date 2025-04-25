const REPO_OWNER = "clawrioaasd";
const REPO_NAME = "test";
const BRANCH = "main";

const RAW_CONTENT_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}`;

const SHOW_NOTIFICATIONS = true;

const EXCLUDE_FILES = [
    "config.json"
];

const MODULE_NAME = "HypeUI";

function getRemoteFiles() {
    try {
        const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${BRANCH}?recursive=1`;
        const response = FileLib.getUrlContent(apiUrl);
        
        if (!response) {
            ChatLib.chat(`&c[HYPE] Failed to fetch file list from GitHub.`);
            return null;
        }
        
        const data = JSON.parse(response);
        
        if (!data.tree) {
            ChatLib.chat(`&c[HYPE] Invalid response from GitHub API.`);
            return null;
        }
        
        return data.tree
            .filter(item => item.type === "blob")
            .map(item => ({
                path: item.path,
                url: `${RAW_CONTENT_URL}/${item.path}`,
                sha: item.sha
            }))
            .filter(file => !EXCLUDE_FILES.includes(file.path));
            
    } catch (error) {
        ChatLib.chat(`&c[HYPE] Error fetching file list: ${error}`);
        return null;
    }
}

function needsUpdate(localPath, remoteUrl, remoteSha) {
    if (!FileLib.exists(MODULE_NAME, localPath)) {
        return true;
    }
    
    try {
        const localContent = FileLib.read(MODULE_NAME, localPath);
        
        if (localPath === "metadata.json") {
            const localData = JSON.parse(localContent);
            const remoteContent = FileLib.getUrlContent(remoteUrl);
            const remoteData = JSON.parse(remoteContent);
            
            return localData.version !== remoteData.version;
        }
        
        const remoteContent = FileLib.getUrlContent(remoteUrl);
        return localContent !== remoteContent;
        
    } catch (error) {
        ChatLib.chat(`&c[HYPE] Error checking for updates: ${error}`);
        return false;
    }
}

function updateFile(filePath, fileUrl) {
    try {
        const lastSlash = filePath.lastIndexOf('/');
        if (lastSlash !== -1) {
            const directoryPath = filePath.substring(0, lastSlash);
            
            const dirs = directoryPath.split('/');
            let currentPath = "";
            
            dirs.forEach(dir => {
                if (currentPath) currentPath += "/";
                currentPath += dir;
                
                if (!FileLib.exists(MODULE_NAME, currentPath)) {
                    FileLib.write(MODULE_NAME, currentPath + "/.placeholder", "", true);
                    FileLib.delete(MODULE_NAME, currentPath + "/.placeholder");
                }
            });
        }
        
        const content = FileLib.getUrlContent(fileUrl);
        
        if (!content && filePath !== ".gitignore") {
            ChatLib.chat(`&c[HYPE] Failed to download: ${filePath}`);
            return false;
        }
        
        FileLib.write(MODULE_NAME, filePath, content || "", true);
        return true;
        
    } catch (error) {
        ChatLib.chat(`&c[HYPE] Error updating file ${filePath}: ${error}`);
        return false;
    }
}

function checkForUpdates() {
    if (SHOW_NOTIFICATIONS) {
        ChatLib.chat(`&9[HYPE] Checking for updates...`);
    }
    
    const remoteFiles = getRemoteFiles();
    
    if (!remoteFiles) {
        return false;
    }
    
    let updatedFiles = 0;
    let failedFiles = 0;
    
    remoteFiles.forEach(file => {
        if (needsUpdate(file.path, file.url, file.sha)) {
            const success = updateFile(file.path, file.url);
            
            if (success) {
                updatedFiles++;
            } else {
                failedFiles++;
            }
        }
    });
    
    if (SHOW_NOTIFICATIONS) {
        if (updatedFiles > 0) {
            ChatLib.chat(`&a[HYPE] Updated ${updatedFiles} file(s).`);
            
            if (failedFiles > 0) {
                ChatLib.chat(`&c[HYPE] Failed to update ${failedFiles} file(s).`);
            }
                        
            new Thread(() => {
                try {
                    ChatLib.chat(`&a[HYPE] Reloading..`);
                    ChatLib.command("ct load", true)
                } catch (e) {
                    ChatLib.chat(`&c[HYPE] Error during auto-reload: ${e}`);
                }
            }).start();
        } else if (failedFiles === 0) {
            ChatLib.chat(`&a[HYPE] You have the latest version.`);
        }
    }
    
    return updatedFiles > 0;
}

export {
    checkForUpdates
};