// 存储标签页数据的对象
let tabsData = {};

// 初始化时从 storage 加载数据
chrome.storage.local.get(['tabsData'], (result) => {
  if (result.tabsData) {
    tabsData = result.tabsData;
  }
});

// 记录标签页被激活的时间
let lastActiveTime = Date.now();

// 监听标签页创建事件
chrome.tabs.onCreated.addListener((tab) => {
  tabsData[tab.id] = {
    url: tab.url,
    title: tab.title,
    visitCount: 0,
    totalTime: 0,
    createdAt: Date.now(),
    lastVisit: Date.now()
  };
  saveData();
});

// 监听标签页激活事件
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const now = Date.now();
  const tab = await chrome.tabs.get(activeInfo.tabId);
  
  updatePreviousTabDuration(now);
  
  if (!tabsData[tab.id]) {
    tabsData[tab.id] = {
      url: tab.url,
      title: tab.title,
      visitCount: 1,
      totalTime: 0,
      createdAt: now,
      lastVisit: now
    };
  } else {
    tabsData[tab.id].visitCount++;
    tabsData[tab.id].lastVisit = now;
  }
  
  lastActiveTime = now;
  saveData();
});

// 更新上一个标签页的使用时长
function updatePreviousTabDuration(now) {
  const duration = now - lastActiveTime;
  chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => {
    if (tabs[0] && tabsData[tabs[0].id]) {
      tabsData[tabs[0].id].totalTime += duration;
    }
  });
}

// 保存数据到 storage
function saveData() {
  chrome.storage.local.set({ tabsData });
}

// 每分钟更新一次当前活跃标签页的使用时长
chrome.alarms.create('updateTime', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateTime') {
    updatePreviousTabDuration(Date.now());
    saveData();
  }
}); 