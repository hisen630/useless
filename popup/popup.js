// 格式化时间显示
function formatTime(ms) {
  if (ms < 1000) {
    return '刚刚';
  }
  if (ms < 60000) {
    return `${Math.floor(ms / 1000)}秒`;
  }
  const minutes = Math.floor(ms / (1000 * 60));
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remainingMinutes = minutes % 60;
    return `${hours}小时${remainingMinutes > 0 ? remainingMinutes + '分钟' : ''}`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}天${remainingHours > 0 ? remainingHours + '小时' : ''}`;
}

// 格式化相对时间
function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) {
    return '刚刚';
  }
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  }
  if (diff < 2592000000) {
    return `${Math.floor(diff / 86400000)}天前`;
  }
  return new Date(timestamp).toLocaleDateString();
}

// 显示标签页列表
async function displayTabs() {
  const tabsList = document.querySelector('.tabs-list');
  const { tabsData } = await chrome.storage.local.get(['tabsData']);
  
  const currentTabs = await chrome.tabs.query({});
  const currentTabsMap = new Map(currentTabs.map(tab => [tab.id, tab]));
  
  const sortedTabs = Object.entries(tabsData)
    .filter(([id]) => currentTabsMap.has(Number(id)))
    .sort(([, a], [, b]) => b.totalTime - a.totalTime);

  tabsList.innerHTML = '';
  
  sortedTabs.forEach(([id, data]) => {
    const tab = currentTabsMap.get(Number(id));
    const element = document.createElement('div');
    element.className = `tab-item ${data.totalTime > 3600000 ? 'warning' : ''}`;
    
    element.innerHTML = `
      <div class="tab-info">
        <div class="tab-title">${data.title}</div>
        <div class="tab-stats">
          访问次数: ${data.visitCount} | 
          使用时长: ${formatTime(data.totalTime)} |
          打开于: ${formatRelativeTime(data.createdAt)}
        </div>
      </div>
      <button class="close-btn">关闭</button>
    `;
    
    element.querySelector('.close-btn').addEventListener('click', () => {
      chrome.tabs.remove(Number(id));
      element.remove();
    });
    
    tabsList.appendChild(element);
  });
}

// 初始显示
displayTabs();

// 每30秒更新一次显示
setInterval(displayTabs, 30000); 