/**
 * 事件提醒 (Event Reminder) v5.4
 * Cloudflare Workers 版
 * 优化：自定义微型时间选择器、Placeholder淡化、UI协调
 */

const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };
  
  // --- 1. 前端应用 (UI) ---
  const HTML_CONTENT = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>事件提醒</title>
      <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" rel="stylesheet">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
          /* 核心变量 */
          :root {
              --bg-body: #f3f4f6;
              --bg-card: #ffffff;
              --text-main: #1f2937;
              --text-sub: #6b7280;
              --text-label: #4b5563; 
              --border-color: rgba(0,0,0,0.08);
              --primary: #3b82f6;
              --primary-rgb: 59, 130, 246;
              --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
              --modal-bg: #ffffff;
              --input-bg: #fff;
              --input-border: #d1d5db;
              --picker-hover: #f3f4f6;
          }
  
          [data-theme="dark"] {
              --bg-body: #111827;
              --bg-card: #1f2937;
              --text-main: #f9fafb;
              --text-sub: #9ca3af;
              --text-label: #e5e7eb;
              --border-color: rgba(255,255,255,0.1);
              --primary: #60a5fa;
              --primary-rgb: 96, 165, 250;
              --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
              --modal-bg: #1f2937;
              --input-bg: #374151;
              --input-border: #4b5563;
              --picker-hover: #374151;
          }
  
          body {
              background-color: var(--bg-body);
              color: var(--text-main);
              font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Arial, sans-serif;
              transition: background-color 0.3s, color 0.3s;
              padding-bottom: 100px;
              -webkit-font-smoothing: antialiased;
          }
  
          .form-label { color: var(--text-label) !important; font-weight: 600; opacity: 0.9; font-size: 0.85rem; margin-bottom: 0.2rem; }
          
          /* 优化 Placeholder 颜色：极淡灰色 */
          ::placeholder { color: var(--text-sub) !important; opacity: 0.4 !important; }
          :-ms-input-placeholder { color: var(--text-sub) !important; opacity: 0.4 !important; }
          ::-ms-input-placeholder { color: var(--text-sub) !important; opacity: 0.4 !important; }
  
          /* 顶部导航 */
          .navbar-custom {
              background: var(--bg-card); padding: 0.8rem 1rem;
              position: sticky; top: 0; z-index: 100;
              box-shadow: var(--shadow);
              display: flex; justify-content: space-between; align-items: center;
              backdrop-filter: blur(10px);
          }
          .brand { font-weight: 700; font-size: 1.2rem; color: var(--primary); display: flex; align-items: center; gap: 8px; }
          .theme-toggle {
              cursor: pointer; width: 36px; height: 36px; border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              background: rgba(var(--primary-rgb), 0.1); color: var(--primary); border: none;
          }
          .search-input {
              background: var(--bg-body); border: 1px solid transparent; color: var(--text-main);
              padding: 0.4rem 1rem; border-radius: 50px; outline: none; width: 100%; max-width: 200px;
          }
  
          /* 卡片 */
          .task-card {
              background: var(--bg-card); border-radius: 16px; 
              padding: 1rem 1.2rem; 
              box-shadow: var(--shadow); border: 1px solid var(--border-color);
              transition: transform 0.2s; height: 100%; display: flex; flex-direction: column; cursor: pointer;
          }
          .task-card:active { transform: scale(0.98); }
          .status-pill {
              display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 6px;
              font-size: 0.7rem; font-weight: 700; margin: 0;
          }
          .pill-safe { background: rgba(16, 185, 129, 0.15); color: #059669; }
          .pill-warn { background: rgba(245, 158, 11, 0.15); color: #d97706; }
          .pill-danger { background: rgba(239, 68, 68, 0.15); color: #dc2626; }
          
          .days-big { font-size: 2.2rem; font-weight: 800; line-height: 1; margin-bottom: 0.2rem; }
          .card-title { font-weight: 700; font-size: 1.1rem; margin-bottom: 0.3rem; color: var(--text-main); }
          .card-note { 
              font-size: 0.8rem; color: var(--text-sub); background: var(--bg-body);
              padding: 4px 8px; border-radius: 6px; margin-top: auto; margin-bottom: 0.8rem;
              white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .icon-container { display: inline-flex; align-items: center; gap: 4px; }
          .svg-icon { width: 14px; height: 14px; display: block; border-radius: 50%; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
  
          .btn-action {
              width: 100%; border-radius: 8px; padding: 6px; border: none; font-weight: 600; font-size: 0.85rem;
              background: var(--primary); color: white; transition: opacity 0.2s;
          }
          .btn-archive-action { background: var(--bg-body); color: var(--text-sub); }
  
          .fab {
              position: fixed; bottom: 30px; right: 30px; z-index: 1050;
              width: 56px; height: 56px; border-radius: 50%; 
              display: flex; align-items: center; justify-content: center;
              font-size: 1.4rem; background-color: var(--primary); color: white; 
              box-shadow: 0 4px 15px rgba(var(--primary-rgb), 0.4); cursor: pointer;
              border: none !important; outline: none !important;
          }
  
          /* Modal & Form */
          .modal-content { background-color: var(--modal-bg); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 20px; }
          .form-control, .form-select {
              background-color: var(--input-bg); border: 1px solid var(--input-border); color: var(--text-main);
              border-radius: 8px; padding: 0.35rem 0.7rem; font-size: 0.9rem;
          }
          .btn-check:checked + .btn-outline-primary { background-color: rgba(59, 130, 246, 0.15); color: var(--primary); border-color: var(--primary); }
          .btn-outline-primary { color: var(--text-sub); border-color: var(--input-border); padding: 4px 10px; font-size: 0.85rem; }
  
          @media (max-width: 576px) {
              .modal-dialog { margin: 0.5rem; max-width: 100%; }
              .modal-content { border-radius: 16px; }
              .modal-header { padding: 0.8rem 1rem; border-bottom: 1px solid var(--border-color); }
              .modal-body { padding: 1rem; } 
              .mb-3 { margin-bottom: 0.6rem !important; }
              .modal-footer { padding: 0.8rem; flex-direction: column; align-items: stretch; gap: 10px; border-top: 1px solid var(--border-color); }
              .modal-footer .d-flex { justify-content: space-between; width: 100%; }
              .modal-footer .btn-primary, .modal-footer .btn-secondary { flex: 1; padding: 10px; }
          }
  
          /* --- 自定义微型时间选择器 (UI 协调核心) --- */
          .time-picker-wrapper { position: relative; }
          .time-picker-popup {
              position: absolute; bottom: 100%; right: 0; width: 180px; 
              background: var(--modal-bg); border: 1px solid var(--border-color);
              border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15);
              z-index: 1060; padding: 0; overflow: hidden;
              display: none; /* 默认隐藏 */
              margin-bottom: 5px;
          }
          .time-picker-header {
              padding: 8px; text-align: center; font-size: 0.8rem; font-weight: bold;
              background: var(--bg-body); border-bottom: 1px solid var(--border-color);
              color: var(--text-sub);
          }
          .time-picker-body { display: flex; height: 160px; }
          .time-col { flex: 1; overflow-y: auto; scrollbar-width: none; padding: 5px 0; border-right: 1px solid var(--border-color); }
          .time-col:last-child { border-right: none; }
          .time-col::-webkit-scrollbar { display: none; }
          .time-item {
              padding: 6px; text-align: center; cursor: pointer; font-size: 0.9rem;
              transition: background 0.1s;
          }
          .time-item:hover { background: var(--picker-hover); }
          .time-item.active { background: var(--primary); color: white; border-radius: 4px; margin: 0 4px; }
  
          .btn-test-premium {
              background-color: rgba(59, 130, 246, 0.1); color: #2563eb; font-weight: 600; font-size: 0.85rem;
              border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 50px; padding: 6px 14px;
              display: inline-flex; align-items: center; gap: 5px; cursor: pointer;
          }
          .btn-del-minimal { color: #ef4444; font-size: 0.85rem; text-decoration: none; padding: 0 5px; }
  
          #auth-overlay { position: fixed; inset: 0; background: var(--bg-body); z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      </style>
  </head>
  <body>
  
      <!-- 登录 -->
      <div id="auth-overlay">
          <div class="text-center p-4">
              <h2 class="fw-bold mb-4" style="color: var(--primary)"><i class="far fa-calendar-check"></i> 事件提醒</h2>
              <input type="password" id="auth-pass" class="form-control form-control-lg text-center mb-3" placeholder="密码" style="max-width: 250px;">
              <button class="btn btn-primary w-100 rounded-pill" onclick="app.login()">进入</button>
          </div>
      </div>
  
      <!-- 主界面 -->
      <div id="app-box" style="display:none">
          <nav class="navbar-custom">
              <div class="brand"><i class="far fa-calendar-check"></i> 事件提醒</div>
              <div class="d-flex gap-3 align-items-center">
                  <input type="text" class="search-input d-none d-md-block" placeholder="搜索..." onkeyup="app.render(this.value)">
                  <button class="theme-toggle" onclick="app.toggleTheme()"><i class="fas fa-adjust"></i></button>
                  <button class="theme-toggle" onclick="app.logout()" style="background:rgba(239,68,68,0.1); color:#ef4444"><i class="fas fa-power-off"></i></button>
              </div>
          </nav>
  
          <div class="container mt-3">
              <ul class="nav nav-pills justify-content-center mb-3" style="gap:10px">
                  <li class="nav-item"><button class="nav-link active rounded-pill px-4" id="tab-active" onclick="app.setTab('active')">运行中</button></li>
                  <li class="nav-item"><button class="nav-link rounded-pill px-4 bg-transparent text-secondary border" id="tab-archived" onclick="app.setTab('archived')">归档</button></li>
              </ul>
          
              <div id="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
              <div class="row g-3" id="list-container"></div>
              <div id="empty-tips" class="text-center py-5" style="display:none; color: var(--text-sub)"><i class="far fa-folder-open fa-3x mb-3 opacity-50"></i><p>无项目</p></div>
          </div>
  
          <button class="fab" onclick="app.openModal()"><i class="fas fa-plus"></i></button>
      </div>
  
      <!-- 紧凑型编辑模态框 -->
      <div class="modal fade" id="itemModal" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content">
                  <div class="modal-header">
                      <h5 class="modal-title fw-bold">编辑事项</h5>
                      <button type="button" class="btn-close" data-bs-dismiss="modal" style="filter: invert(var(--invert-icon))"></button>
                  </div>
                  <div class="modal-body">
                      <form id="editorForm">
                          <input type="hidden" id="editId">
                          
                          <div class="mb-3">
                              <label class="form-label">名称</label>
                              <input type="text" class="form-control fw-bold" id="itemName" placeholder="例如：GV 保号" required>
                          </div>
  
                          <div class="mb-3">
                              <label class="form-label">模式</label>
                              <div class="btn-group w-100" role="group">
                                  <input type="radio" class="btn-check" name="modeType" id="modeCycle" value="cycle" checked onchange="app.toggleMode()">
                                  <label class="btn btn-outline-primary" for="modeCycle">循环重复</label>
                                  <input type="radio" class="btn-check" name="modeType" id="modeOne" value="target" onchange="app.toggleMode()">
                                  <label class="btn btn-outline-primary" for="modeOne">单次提醒</label>
                              </div>
                          </div>
  
                          <div id="group-cycle">
                              <div class="row g-2 mb-3">
                                  <div class="col-6">
                                      <label class="form-label">周期</label>
                                      <select class="form-select" id="cyclePreset" onchange="app.toggleCycleInput()">
                                          <option value="m-1">1个月</option>
                                          <option value="m-3" selected>3个月</option>
                                          <option value="m-6">6个月</option>
                                          <option value="m-12">1年</option>
                                          <option value="custom">自定义(天)</option>
                                      </select>
                                      <input type="number" id="customDaysInput" class="form-control mt-2" placeholder="天数" style="display:none" min="1">
                                  </div>
                                  <div class="col-6">
                                      <label class="form-label">上次操作</label>
                                      <input type="date" class="form-control" id="lastTime">
                                  </div>
                              </div>
                          </div>
  
                          <div id="group-target" style="display:none">
                              <div class="mb-3">
                                  <label class="form-label">截止日期</label>
                                  <input type="date" class="form-control" id="targetTime">
                              </div>
                          </div>
  
                          <div class="mb-3">
                              <label class="form-label">备注</label>
                              <textarea class="form-control" id="notes" rows="1" placeholder="选填"></textarea>
                          </div>
  
                          <div class="row g-2 mb-3 align-items-end">
                              <div class="col-9">
                                  <label class="form-label">提醒规则</label>
                                  <input type="text" class="form-control" id="reminders" value="" placeholder="到期日之前，使用逗号分隔">
                              </div>
                              <div class="col-3">
                                  <label class="form-label">通知时间</label>
                                  <!-- 自定义微型时间选择器 -->
                                  <div class="time-picker-wrapper">
                                      <input type="text" class="form-control text-center" id="notifyTime" readonly value="10:00" onclick="app.toggleTimePicker(event)">
                                      <div id="timePickerPopup" class="time-picker-popup" onclick="event.stopPropagation()">
                                          <div class="time-picker-header">选择时间</div>
                                          <div class="time-picker-body">
                                              <div class="time-col" id="tp-hour"></div>
                                              <div class="time-col" id="tp-min"></div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
  
                          <div class="p-2 rounded-3 border border-color d-flex justify-content-between align-items-center mb-1">
                              <label class="form-label m-0">Telegram</label>
                              <div class="form-check form-switch m-0">
                                  <input class="form-check-input" type="checkbox" id="notifyTg" checked>
                              </div>
                          </div>
                          <div class="p-2 rounded-3 border border-color d-flex justify-content-between align-items-center">
                              <label class="form-label m-0">Email (Resend)</label>
                              <div class="form-check form-switch m-0">
                                  <input class="form-check-input" type="checkbox" id="notifyEmail">
                              </div>
                          </div>
  
                      </form>
                  </div>
                  <div class="modal-footer">
                      <div class="d-flex align-items-center w-100 justify-content-between mb-2 mb-sm-0" style="margin-right:auto;">
                          <button type="button" class="btn-del-minimal bg-transparent border-0" id="btnDel" onclick="app.delItem()">删除</button>
                          <button type="button" class="btn-test-premium" id="btnTest" onclick="app.testNotify()" style="display:none">
                              <i class="fas fa-paper-plane"></i> 发送测试
                          </button>
                      </div>
                      <div class="d-flex gap-2 w-100">
                          <button type="button" class="btn btn-secondary flex-fill" data-bs-dismiss="modal">取消</button>
                          <button type="button" class="btn btn-primary flex-fill" onclick="app.save()">保存</button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      <script>
          const app = {
              data: [], tab: 'active', token: localStorage.getItem('er_token'), theme: localStorage.getItem('er_theme') || 'light',
              lastDataHash: '',
              
              init() {
                  document.documentElement.setAttribute('data-theme', this.theme);
                  this.updateThemeIcon();
                  const shDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
                  document.getElementById('lastTime').value = shDate; 
                  document.getElementById('targetTime').value = shDate;
                  
                  // 初始化自定义时间选择器DOM
                  this.initCustomTimePicker();
  
                  if(this.token) {
                      this.loadData();
                      setInterval(() => this.loadData(true), 5000);
                  }
                  
                  // 点击外部关闭时间选择器
                  document.addEventListener('click', (e) => {
                      if (!e.target.closest('.time-picker-wrapper')) {
                          document.getElementById('timePickerPopup').style.display = 'none';
                      }
                  });
  
                  document.addEventListener('visibilitychange', () => {
                      if (document.visibilityState === 'visible' && this.token) this.loadData(true);
                  });
              },
  
              // --- 自定义时间选择器逻辑 ---
              initCustomTimePicker() {
                  const hCol = document.getElementById('tp-hour');
                  const mCol = document.getElementById('tp-min');
                  
                  // 渲染小时 00-23
                  for(let i=0; i<24; i++) {
                      const val = i.toString().padStart(2,'0');
                      const div = document.createElement('div');
                      div.className = 'time-item';
                      div.innerText = val;
                      div.onclick = () => this.selectTime('h', val);
                      hCol.appendChild(div);
                  }
                  // 渲染分钟 00-55 (5分钟间隔)
                  for(let i=0; i<60; i+=5) {
                      const val = i.toString().padStart(2,'0');
                      const div = document.createElement('div');
                      div.className = 'time-item';
                      div.innerText = val;
                      div.onclick = () => this.selectTime('m', val);
                      mCol.appendChild(div);
                  }
              },
              toggleTimePicker(e) {
                  e.stopPropagation();
                  const popup = document.getElementById('timePickerPopup');
                  const currentVal = document.getElementById('notifyTime').value || '10:00';
                  const [h, m] = currentVal.split(':');
                  
                  // 高亮当前选中的
                  this.highlightTime('tp-hour', h);
                  this.highlightTime('tp-min', m);
                  
                  popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
              },
              selectTime(type, val) {
                  const input = document.getElementById('notifyTime');
                  let [h, m] = input.value.split(':');
                  if(type === 'h') h = val; else m = val;
                  input.value = \`\${h}:\${m}\`;
                  
                  // 更新高亮
                  if(type === 'h') this.highlightTime('tp-hour', val);
                  else this.highlightTime('tp-min', val);
              },
              highlightTime(colId, val) {
                  const col = document.getElementById(colId);
                  Array.from(col.children).forEach(el => {
                      if(el.innerText === val) {
                          el.classList.add('active');
                          el.scrollIntoView({block: 'center'});
                      } else el.classList.remove('active');
                  });
              },
              // ---------------------------
  
              async loadData(silent = false) {
                  try {
                      const res = await fetch('/api/list', { headers: {'x-auth-token': this.token} });
                      if(res.status === 401) throw new Error();
                      const json = await res.json();
                      
                      const currentHash = JSON.stringify(json);
                      if (currentHash !== this.lastDataHash) {
                          this.data = json;
                          this.lastDataHash = currentHash;
                          this.render();
                      }
  
                      if(!silent) {
                          document.getElementById('auth-overlay').style.display = 'none'; 
                          document.getElementById('app-box').style.display = 'block';
                      }
                  } catch(e) { if(!silent) this.logout(); }
              },
              login() {
                  const p = document.getElementById('auth-pass').value; if(!p) return;
                  this.token = p; localStorage.setItem('er_token', p); this.loadData();
                  setInterval(() => this.loadData(true), 5000);
              },
              logout() { localStorage.removeItem('er_token'); location.reload(); },
              toggleTheme() {
                  this.theme = this.theme === 'light' ? 'dark' : 'light';
                  document.documentElement.setAttribute('data-theme', this.theme);
                  localStorage.setItem('er_theme', this.theme); this.updateThemeIcon();
              },
              updateThemeIcon() { document.documentElement.style.setProperty('--invert-icon', this.theme === 'dark' ? '1' : '0'); },
              setTab(t) {
                  this.tab = t;
                  document.getElementById('tab-active').className = t==='active' ? 'nav-link active rounded-pill px-4' : 'nav-link rounded-pill px-4 bg-transparent text-secondary border';
                  document.getElementById('tab-archived').className = t==='archived' ? 'nav-link active rounded-pill px-4' : 'nav-link rounded-pill px-4 bg-transparent text-secondary border';
                  this.render();
              },
              calcDue(item) {
                  const getDateObj = (dStr) => {
                      const d = new Date(dStr);
                      return new Date(d.valueOf() + d.getTimezoneOffset() * 60000);
                  }
                  if(item.mode === 'target') return getDateObj(item.targetDate);
                  const last = getDateObj(item.lastDate);
                  const due = new Date(last);
                  const val = parseInt(item.cycleValue || item.cycle); const unit = item.cycleUnit || 'm'; 
                  if (unit === 'd') due.setDate(due.getDate() + val); else due.setMonth(due.getMonth() + val);
                  return due;
              },
              getDays(item) { 
                  const nowStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
                  const now = new Date(nowStr);
                  const due = this.calcDue(item);
                  now.setHours(0,0,0,0); due.setHours(0,0,0,0);
                  return Math.round((due - now) / (1000 * 3600 * 24)); 
              },
              render(keyword = '') {
                  const listEl = document.getElementById('list-container'); listEl.innerHTML = ''; document.getElementById('loading').style.display = 'none';
                  let filtered = this.data.filter(item => {
                      if(this.tab === 'active' && item.status === 'archived') return false;
                      if(this.tab === 'archived' && item.status !== 'archived') return false;
                      if(keyword && !item.name.toLowerCase().includes(keyword.toLowerCase())) return false;
                      return true;
                  });
                  filtered.sort((a,b) => this.getDays(a) - this.getDays(b));
                  if(filtered.length === 0) { document.getElementById('empty-tips').style.display = 'block'; return; }
                  document.getElementById('empty-tips').style.display = 'none';
  
                  filtered.forEach(item => {
                      const days = this.getDays(item);
                      let pillClass = 'pill-safe', pillText = '状态良好', dayColor = 'var(--primary)';
                      if(days <= 15) { pillClass = 'pill-warn'; pillText = '临近'; dayColor = '#f59e0b'; }
                      if(days <= 7) { pillClass = 'pill-danger'; pillText = '急需'; dayColor = '#ef4444'; }
                      if(days < 0) { pillClass = 'pill-danger'; pillText = '逾期'; dayColor = '#ef4444'; }
  
                      let btnHtml = '';
                      if(this.tab === 'active') {
                          btnHtml = item.mode === 'cycle' 
                              ? \`<button class="btn-action" onclick="event.stopPropagation(); app.renew('\${item.id}')"><i class="fas fa-sync-alt me-1"></i> 刷新</button>\`
                              : \`<button class="btn-action btn-archive-action" onclick="event.stopPropagation(); app.archive('\${item.id}')"><i class="fas fa-check"></i> 归档</button>\`;
                      } else {
                          btnHtml = \`<button class="btn-action btn-archive-action" onclick="event.stopPropagation(); app.unarchive('\${item.id}')"><i class="fas fa-undo"></i> 激活</button>\`;
                      }
  
                      let cycleText = '单次';
                      if(item.mode === 'cycle') {
                          const unit = item.cycleUnit || 'm'; const val = item.cycleValue || item.cycle;
                          cycleText = unit === 'd' ? \`\${val}天\` : \`\${val}个月\`;
                      }
                      
                      const tgSvg = item.notify ? \`<svg class="svg-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="#2AABEE"/><path fill="#FFF" d="M5.4 12l13.2-5.4c.6-.2.9 0 .7.6l-2.2 10.8c-.2.8-.6.8-1.2.5l-3.3-2.5-1.6 1.6c-.2.2-.4.4-.7.4l.4-3.5 6.3-5.7c.3-.3-.2-.5-.5-.3l-7.9 5.0-3.4-1.1c-.7-.2-.7-.7.1-1.0z" transform="translate(-1, 1)"/></svg>\` : '';
                      const mailSvg = item.notifyEmail ? \`<svg class="svg-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="#F59E0B"/><path d="M5 8.5L12 13L19 8.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="5" y="7" width="14" height="10" rx="1" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>\` : '';
                      let iconsHtml = tgSvg + mailSvg;
                      if(!iconsHtml) iconsHtml = ''; 
  
                      listEl.innerHTML += \`
                      <div class="col-12 col-md-6 col-lg-4">
                          <div class="task-card" onclick="app.edit('\${item.id}')">
                              <div class="d-flex justify-content-between align-items-center mb-3">
                                  <div class="d-flex align-items-center gap-2">
                                      <span class="status-pill \${pillClass} m-0">\${pillText}</span>
                                      <div class="icon-container">\${iconsHtml}</div>
                                  </div>
                                  <small style="color:var(--text-sub); font-weight:500;">\${cycleText}</small>
                              </div>
                              <div class="days-big" style="color: \${dayColor}">\${days}</div>
                              <div class="card-title text-truncate">\${item.name}</div>
                              <div class="card-note">\${item.notes || '-'}</div>
                              \${btnHtml}
                          </div>
                      </div>\`;
                  });
              },
              toggleMode() {
                  const isCycle = document.getElementById('modeCycle').checked;
                  document.getElementById('group-cycle').style.display = isCycle ? 'block' : 'none';
                  document.getElementById('group-target').style.display = isCycle ? 'none' : 'block';
              },
              toggleCycleInput() {
                  const val = document.getElementById('cyclePreset').value;
                  const input = document.getElementById('customDaysInput');
                  input.style.display = val === 'custom' ? 'block' : 'none';
                  if(val==='custom') input.focus();
              },
              openModal() {
                  document.getElementById('editorForm').reset(); document.getElementById('editId').value = ''; 
                  document.getElementById('btnDel').style.display = 'none';
                  document.getElementById('btnTest').style.display = 'none';
                  const shDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
                  document.getElementById('lastTime').value = shDate; document.getElementById('targetTime').value = shDate;
                  document.getElementById('cyclePreset').value = 'm-3';
                  document.getElementById('notifyTime').value = '10:00';
                  this.toggleMode(); this.toggleCycleInput();
                  new bootstrap.Modal(document.getElementById('itemModal')).show();
              },
              edit(id) {
                  const item = this.data.find(i => i.id === id);
                  document.getElementById('editId').value = item.id; document.getElementById('itemName').value = item.name;
                  document.getElementById('notes').value = item.notes || '';
                  document.getElementById('reminders').value = (item.reminders || [30,15,7,3,1,0]).join(', ');
                  document.getElementById('notifyTime').value = item.notifyTime || '10:00'; 
                  document.getElementById('notifyTg').checked = item.notify; document.getElementById('notifyEmail').checked = item.notifyEmail || false;
                  document.getElementById('btnDel').style.display = 'block';
                  document.getElementById('btnTest').style.display = 'inline-flex'; 
  
                  if(item.mode === 'cycle') {
                      document.getElementById('modeCycle').checked = true; document.getElementById('lastTime').value = item.lastDate;
                      const unit = item.cycleUnit || 'm'; const val = item.cycleValue || item.cycle;
                      const presetVal = \`\${unit}-\${val}\`; const select = document.getElementById('cyclePreset');
                      if(select.querySelector(\`option[value="\${presetVal}"]\`)) { select.value = presetVal; document.getElementById('customDaysInput').style.display = 'none'; }
                      else { select.value = 'custom'; document.getElementById('customDaysInput').style.display = 'block'; document.getElementById('customDaysInput').value = val; }
                  } else { document.getElementById('modeOne').checked = true; document.getElementById('targetTime').value = item.targetDate; }
                  
                  this.toggleMode(); new bootstrap.Modal(document.getElementById('itemModal')).show();
              },
              async save() {
                  const id = document.getElementById('editId').value || crypto.randomUUID();
                  const mode = document.getElementById('modeCycle').checked ? 'cycle' : 'target';
                  const name = document.getElementById('itemName').value; if(!name) return alert('名称必填');
                  
                  const item = {
                      id, mode, name, notes: document.getElementById('notes').value,
                      notify: document.getElementById('notifyTg').checked, notifyEmail: document.getElementById('notifyEmail').checked,
                      reminders: document.getElementById('reminders').value.split(/[,，]/).map(n=>parseInt(n.trim())).filter(n=>!isNaN(n)),
                      notifyTime: document.getElementById('notifyTime').value || '10:00',
                      status: 'active'
                  };
                  
                  const old = this.data.find(i => i.id === id); if(old) item.status = old.status;
  
                  if(mode === 'cycle') {
                      item.lastDate = document.getElementById('lastTime').value;
                      const preset = document.getElementById('cyclePreset').value;
                      if (preset === 'custom') {
                          item.cycleUnit = 'd'; item.cycleValue = parseInt(document.getElementById('customDaysInput').value);
                          if (!item.cycleValue) return alert('请输入天数');
                      } else { const [u, v] = preset.split('-'); item.cycleUnit = u; item.cycleValue = parseInt(v); }
                      item.cycle = item.cycleValue; 
                  } else { item.targetDate = document.getElementById('targetTime').value; }
                  
                  await this.api('/update', item); bootstrap.Modal.getInstance(document.getElementById('itemModal')).hide(); this.loadData(true);
              },
              async renew(id) {
                  const item = this.data.find(i => i.id === id); if(!confirm(\`确认【\${item.name}】已完成？\`)) return;
                  const shDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
                  item.lastDate = shDate; 
                  await this.api('/update', item); this.loadData(true);
              },
              async testNotify() {
                  const id = document.getElementById('editId').value;
                  if(!id) return alert('请先保存');
                  if(!confirm('发送测试通知？')) return;
                  try {
                      const res = await fetch('/api/test-single?id=' + id, { headers: {'x-auth-token': this.token} });
                      if(res.ok) alert('✅ 请求已发送'); else alert('❌ 发送失败');
                  } catch(e) { alert('❌ 网络错误'); }
              },
              async archive(id) { const item = this.data.find(i => i.id === id); item.status = 'archived'; await this.api('/update', item); this.loadData(true); },
              async unarchive(id) { const item = this.data.find(i => i.id === id); item.status = 'active'; await this.api('/update', item); this.setTab('active'); },
              async delItem() { if(!confirm('删除？')) return; await this.api('/delete?id=' + document.getElementById('editId').value); bootstrap.Modal.getInstance(document.getElementById('itemModal')).hide(); this.loadData(true); },
              async api(url, data) {
                  const opts = { method: 'POST', headers: {'Content-Type': 'application/json', 'x-auth-token': this.token} };
                  if(data) opts.body = JSON.stringify(data); return fetch('/api' + url, opts);
              }
          }; app.init();
      </script>
  </body>
  </html>
  `;
  
  // --- 2. 后端逻辑 ---
  export default {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      if (url.pathname === '/') return new Response(HTML_CONTENT, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
      if (url.pathname.startsWith('/api')) {
          if (request.headers.get('x-auth-token') !== env.AUTH_PASSWORD) return new Response('Unauthorized', { status: 401 });
      }
      if (url.pathname === '/api/list') {
        const data = await env.KEEP_ALIVE_DB.get('accounts', { type: 'json' }); return new Response(JSON.stringify(data || []), DEFAULT_HEADERS);
      }
      if (url.pathname === '/api/update') {
        const item = await request.json(); let list = (await env.KEEP_ALIVE_DB.get('accounts', { type: 'json' })) || [];
        const idx = list.findIndex(a => a.id === item.id); if (idx > -1) list[idx] = item; else list.push(item);
        await env.KEEP_ALIVE_DB.put('accounts', JSON.stringify(list)); return new Response('{"ok":true}', DEFAULT_HEADERS);
      }
      if (url.pathname === '/api/delete') {
          const id = url.searchParams.get('id'); let list = (await env.KEEP_ALIVE_DB.get('accounts', { type: 'json' })) || [];
          list = list.filter(a => a.id !== id); await env.KEEP_ALIVE_DB.put('accounts', JSON.stringify(list)); return new Response('{"ok":true}', DEFAULT_HEADERS);
      }
      if (url.pathname === '/api/test-single') {
          const id = url.searchParams.get('id');
          const list = (await env.KEEP_ALIVE_DB.get('accounts', { type: 'json' })) || [];
          const item = list.find(i => i.id === id);
          if(item) {
              const shDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
              const now = new Date(shDateStr);
              now.setHours(0,0,0,0);
  
              let dueDate = calculateDueDate(item);
              dueDate.setHours(0,0,0,0);
  
              const diff = dueDate - now; 
              const days = Math.round(diff / (1000 * 3600 * 24));
              
              await sendNotification(env, item, days, dueDate, true);
              return new Response('{"ok":true}', DEFAULT_HEADERS);
          }
          return new Response('{"ok":false, "err":"Item not found"}', DEFAULT_HEADERS);
      }
      return new Response('404', { status: 404 });
    },
    async scheduled(event, env, ctx) { ctx.waitUntil(runSchedule(env)); }
  };
  
  // --- 3. 核心通知逻辑 ---
  function calculateDueDate(item) {
      const parseLocal = (s) => {
          const d = new Date(s);
          return new Date(d.valueOf() + d.getTimezoneOffset() * 60000);
      };
  
      if (item.mode === 'target') {
          return parseLocal(item.targetDate);
      } else {
          const last = parseLocal(item.lastDate);
          const due = new Date(last);
          const unit = item.cycleUnit || 'm'; 
          const val = parseInt(item.cycleValue || item.cycle); 
          if (unit === 'd') due.setDate(due.getDate() + val); 
          else due.setMonth(due.getMonth() + val);
          return due;
      }
  }
  
  async function runSchedule(env) {
      const list = (await env.KEEP_ALIVE_DB.get('accounts', { type: 'json' })) || [];
      
      const shDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      const now = new Date(shDateStr);
      now.setHours(0,0,0,0);
      
      for (const item of list) {
          if (item.status === 'archived') continue;
          if (!item.notify && !item.notifyEmail) continue; 
  
          let dueDate = calculateDueDate(item);
          dueDate.setHours(0,0,0,0);
  
          const diff = dueDate - now; 
          const days = Math.round(diff / (1000 * 3600 * 24));
          const reminders = item.reminders || [15, 7, 3, 0];
  
          if (reminders.includes(days) || (days < 0 && days % 7 === 0)) {
               await sendNotification(env, item, days, dueDate, false);
          }
      }
  }
  
  async function sendNotification(env, item, days, dueDate, force) {
      let icon = "🔔"; if(days <= 3) icon = "🔴"; else if(days <= 7) icon = "🟠";
      if (force) icon = "📢 [测试]";
  
      const msgTitle = `[事件提醒] ${item.name}`;
      const msgBody = `⏳ 剩余: ${days} 天\n📅 到期: ${dueDate.toLocaleDateString()}\n📝 备注: ${item.notes || '无'}`;
      
      if (item.notify && env.TG_BOT_TOKEN && env.TG_CHAT_ID) {
          const tgMsg = `${icon} **${msgTitle}**\n\n${msgBody}`;
          try {
              await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chat_id: env.TG_CHAT_ID, text: tgMsg, parse_mode: 'Markdown' })
              });
          } catch(e) { console.log('TG Err', e); }
      }
  
      if (item.notifyEmail && env.RESEND_API_KEY && env.RESEND_TO) {
          const htmlContent = `
              <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                  <h2 style="color: #3b82f6; margin-top:0;">${icon} ${msgTitle}</h2>
                  <p style="font-size: 16px;"><strong>剩余天数：</strong> <span style="color: ${days <= 7 ? 'red' : 'black'}">${days} 天</span></p>
                  <p><strong>到期日期：</strong> ${dueDate.toLocaleDateString()}</p>
                  <p><strong>备注信息：</strong><br>${item.notes || '无'}</p>
                  <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 20px 0;">
                  <p style="font-size: 12px; color: #6b7280;">来自事件提醒助手</p>
              </div>`;
          
          await sendResendEmail(env, `${icon} ${msgTitle} (剩余 ${days} 天)`, htmlContent);
      }
  }
  
  async function sendResendEmail(env, subject, html) {
      const from = env.RESEND_FROM || 'onboarding@resend.dev';
      const toEnv = env.RESEND_TO;
      const toAddresses = toEnv ? toEnv.split(',').map(e => e.trim()).filter(e => e) : [];
      if (!toAddresses.length) return;
  
      try {
          await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ from: from, to: toAddresses, subject: subject, html: html })
          });
      } catch (e) { console.error('Email Send Error:', e); }
  }
