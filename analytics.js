/**
 * WebBOM Analytics — localStorage 版（中國大陸適用）
 *
 * 輕量埋點，零依賴。事件存入 localStorage，管理員可在儀表板匯出。
 *
 * 搜集事件：pageview / select / inquiry / error
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'webbom_analytics';
  var MAX_EVENTS = 1000;

  function detectDevice() {
    var ua = navigator.userAgent;
    var os = 'unknown', browser = 'unknown', mobile = false;

    if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/Windows/.test(ua)) os = 'Windows';
    else if (/Mac OS/.test(ua)) os = 'macOS';
    else if (/Linux/.test(ua)) os = 'Linux';

    if (/Safari/.test(ua) && !/Chrome|CriOS/.test(ua)) browser = 'Safari';
    else if (/Chrome|CriOS/.test(ua)) browser = 'Chrome';
    else if (/Firefox/.test(ua)) browser = 'Firefox';
    else if (/Edge|Edg/.test(ua)) browser = 'Edge';
    else if (/WeChat|MicroMessenger/.test(ua)) browser = 'WeChat';

    mobile = /Android|iPhone|iPad|iPod|webOS/i.test(ua) ||
             (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));

    return {
      os: os, browser: browser, mobile: mobile,
      screen: window.screen ? window.screen.width + 'x' + window.screen.height : '',
      viewport: window.innerWidth + 'x' + window.innerHeight,
      language: navigator.language || 'unknown',
      dpr: window.devicePixelRatio || 1
    };
  }

  function getProductId() {
    var params = new URLSearchParams(window.location.search);
    return params.get('product') || 'index';
  }

  // ============================================================
  // localStorage 讀寫
  // ============================================================
  function loadEvents() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveEvents(events) {
    try {
      // 只保留最近 MAX_EVENTS 筆
      if (events.length > MAX_EVENTS) {
        events = events.slice(events.length - MAX_EVENTS);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (e) { /* quota exceeded, drop oldest */ }
  }

  function pushEvent(evt) {
    var events = loadEvents();
    events.push(evt);
    saveEvents(events);
  }

  // ============================================================
  // 公開 API（與舊版完全相容）
  // ============================================================
  var deviceInfo = detectDevice();

  window.WebBOMAnalytics = {
    pageview: function (product) {
      pushEvent({
        type: 'pageview',
        timestamp: new Date().toISOString(),
        product: product || getProductId(),
        device: deviceInfo.os + '/' + deviceInfo.browser + (deviceInfo.mobile ? '/mobile' : '/desktop'),
        screen: deviceInfo.screen,
        viewport: deviceInfo.viewport,
        language: deviceInfo.language,
        dpr: deviceInfo.dpr,
        referrer: document.referrer || 'direct'
      });
    },

    select: function (action, part) {
      pushEvent({
        type: 'select',
        timestamp: new Date().toISOString(),
        product: getProductId(),
        device: deviceInfo.os + '/' + deviceInfo.browser,
        partId: part.id || '',
        partNumber: part.partNumber || '',
        partName: part.name || '',
        action: action,
        quantity: part.quantity || 0
      });
    },

    inquiry: function (inquiry) {
      pushEvent({
        type: 'inquiry',
        timestamp: new Date().toISOString(),
        product: getProductId(),
        device: deviceInfo.os + '/' + deviceInfo.browser,
        totalParts: inquiry.totalParts || 0,
        totalQty: inquiry.totalQty || 0,
        emailDomain: inquiry.emailDomain || '',
        partNumbers: (inquiry.partNumbers || []).join('|')
      });
    },

    error: function (message, stack, file, line, col) {
      pushEvent({
        type: 'error',
        timestamp: new Date().toISOString(),
        product: getProductId(),
        device: deviceInfo.os + '/' + deviceInfo.browser,
        message: String(message).substring(0, 500),
        file: String(file || '').substring(0, 200),
        line: line || 0,
        col: col || 0,
        stack: String(stack || '').substring(0, 1000),
        href: location.href
      });
    },

    /** 匯出全部事件（供管理員下載） */
    exportCSV: function () {
      var events = loadEvents();
      if (events.length === 0) return '';
      var keys = Object.keys(events[0]);
      var csv = keys.join(',') + '\n';
      events.forEach(function (e) {
        csv += keys.map(function (k) {
          var v = (e[k] === undefined || e[k] === null) ? '' : String(e[k]);
          return '"' + v.replace(/"/g, '""') + '"';
        }).join(',') + '\n';
      });
      return csv;
    },

    /** 獲取事件統計摘要 */
    getSummary: function () {
      var events = loadEvents();
      var summary = {
        total: events.length,
        pageviews: events.filter(function(e) { return e.type === 'pageview'; }).length,
        selects: events.filter(function(e) { return e.type === 'select'; }).length,
        inquiries: events.filter(function(e) { return e.type === 'inquiry'; }).length,
        errors: events.filter(function(e) { return e.type === 'error'; }).length,
        devices: {},
        products: {}
      };
      events.forEach(function(e) {
        if (e.device) { summary.devices[e.device] = (summary.devices[e.device] || 0) + 1; }
        if (e.product) { summary.products[e.product] = (summary.products[e.product] || 0) + 1; }
      });
      return summary;
    },

    /** 清除所有事件 */
    clear: function () {
      localStorage.removeItem(STORAGE_KEY);
    },

    getDeviceInfo: function () {
      return deviceInfo;
    },

    // 向後相容（noop）
    flush: function () {}
  };

  // ============================================================
  // 全局錯誤捕捉
  // ============================================================
  window.addEventListener('error', function (e) {
    if (e.target && (e.target instanceof HTMLScriptElement ||
        e.target instanceof HTMLLinkElement ||
        e.target instanceof HTMLImageElement)) {
      window.WebBOMAnalytics.error(
        'Resource load error: ' + (e.target.src || e.target.href || 'unknown'),
        '', e.filename, e.lineno, e.colno
      );
      return;
    }
    window.WebBOMAnalytics.error(
      e.message || 'Unknown error',
      e.error ? e.error.stack : '',
      e.filename, e.lineno, e.colno
    );
  }, true);

  window.addEventListener('unhandledrejection', function (e) {
    window.WebBOMAnalytics.error(
      'Unhandled Promise: ' + (e.reason ? String(e.reason).substring(0, 200) : 'unknown'),
      e.reason ? e.reason.stack : '',
      '', 0, 0
    );
  });

})();
