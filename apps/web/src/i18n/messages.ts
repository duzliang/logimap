// i18n 文案字典（T4-2 国际化）
// 以中文为源语言；`en` 由 TypeScript 强制与 `zh` 保持相同结构（缺 key 会编译报错）。

export const zh = {
  common: {
    loading: '加载中...',
    save: '保存',
    cancel: '取消',
    confirm: '确认',
    appName: 'LogiMap'
  },
  language: {
    label: '语言',
    zh: '中文',
    en: 'English',
    switchTo: '切换语言'
  },
  nav: {
    dashboard: '仪表盘',
    systems: '系统',
    search: '搜索',
    codeLinks: '代码反向关联',
    notifications: '通知',
    teamSettings: '团队设置',
    accountSettings: '账户设置',
    apiTokens: 'API 令牌'
  },
  topbar: {
    selectTeam: '选择团队',
    switchTeam: '切换团队',
    teamSettings: '团队设置',
    logout: '退出登录',
    logoutSuccess: '已退出登录',
    switchTeamSuccess: '已切换团队'
  },
  auth: {
    loginTitle: '登录您的账户',
    registerTitle: '创建您的账户',
    email: '邮箱',
    password: '密码',
    username: '用户名',
    usernamePlaceholder: '您的用户名',
    login: '登录',
    loggingIn: '登录中...',
    register: '注册',
    registering: '注册中...',
    noAccount: '还没有账户？',
    goRegister: '立即注册',
    hasAccount: '已有账户？',
    goLogin: '立即登录',
    loginSuccess: '登录成功',
    loginError: '登录失败，请检查账号密码',
    registerSuccess: '注册成功',
    registerError: '注册失败'
  },
  dashboard: {
    welcome: '欢迎使用 LogiMap',
    subtitle: '业务逻辑管理系统 - Phase 1 治理中',
    systemsCardTitle: '系统管理',
    systemsCardDesc: '管理业务系统和模块',
    systemsCardHint: '创建和管理您的业务系统',
    authWarning: '无法验证登录状态，请检查网络连接'
  },
  account: {
    title: '账户设置',
    subtitle: '管理你的个人通知偏好。',
    emailNotifications: '邮件通知',
    emailNotificationsDesc: '开启后，站内通知将同时通过邮件发送到 {email}（需管理员在服务端配置邮件服务）。',
    emailNotificationsToggle: '邮件通知开关',
    prefUpdated: '已更新邮件通知偏好',
    updateFailed: '更新失败',
    language: '界面语言',
    languageDesc: '选择 LogiMap 界面显示的语言。'
  }
}

export type Messages = typeof zh

export const en: Messages = {
  common: {
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    appName: 'LogiMap'
  },
  language: {
    label: 'Language',
    zh: '中文',
    en: 'English',
    switchTo: 'Switch language'
  },
  nav: {
    dashboard: 'Dashboard',
    systems: 'Systems',
    search: 'Search',
    codeLinks: 'Code References',
    notifications: 'Notifications',
    teamSettings: 'Team Settings',
    accountSettings: 'Account Settings',
    apiTokens: 'API Tokens'
  },
  topbar: {
    selectTeam: 'Select team',
    switchTeam: 'Switch team',
    teamSettings: 'Team settings',
    logout: 'Log out',
    logoutSuccess: 'Logged out',
    switchTeamSuccess: 'Team switched'
  },
  auth: {
    loginTitle: 'Sign in to your account',
    registerTitle: 'Create your account',
    email: 'Email',
    password: 'Password',
    username: 'Username',
    usernamePlaceholder: 'Your username',
    login: 'Sign in',
    loggingIn: 'Signing in...',
    register: 'Sign up',
    registering: 'Signing up...',
    noAccount: "Don't have an account?",
    goRegister: 'Sign up now',
    hasAccount: 'Already have an account?',
    goLogin: 'Sign in now',
    loginSuccess: 'Signed in',
    loginError: 'Sign in failed, please check your credentials',
    registerSuccess: 'Signed up',
    registerError: 'Sign up failed'
  },
  dashboard: {
    welcome: 'Welcome to LogiMap',
    subtitle: 'Business logic management — Phase 1 governance',
    systemsCardTitle: 'System Management',
    systemsCardDesc: 'Manage business systems and modules',
    systemsCardHint: 'Create and manage your business systems',
    authWarning: 'Unable to verify sign-in status, please check your connection'
  },
  account: {
    title: 'Account Settings',
    subtitle: 'Manage your personal notification preferences.',
    emailNotifications: 'Email notifications',
    emailNotificationsDesc: 'When enabled, in-app notifications are also sent by email to {email} (requires the admin to configure the mail service on the server).',
    emailNotificationsToggle: 'Toggle email notifications',
    prefUpdated: 'Email notification preference updated',
    updateFailed: 'Update failed',
    language: 'Interface language',
    languageDesc: 'Choose the language for the LogiMap interface.'
  }
}

export const messages = { zh, en } as const
export type Lang = keyof typeof messages
