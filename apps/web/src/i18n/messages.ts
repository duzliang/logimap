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
  },
  systems: {
    title: '系统管理',
    subtitle: '创建和管理业务系统与模块',
    importFromGit: '从 Git 导入',
    aiBatch: 'AI 批量建议',
    createSystem: '创建系统',
    emptyTitle: '暂无系统',
    emptyDesc: '创建第一个系统来开始管理您的业务逻辑',
    modulesCount: '{count} 个模块',
    enterSystem: '进入系统',
    deleteConfirm: '确定要删除系统"{name}"吗？',
    editTitle: '编辑系统',
    createTitle: '创建新系统',
    editDesc: '修改系统信息与关联的代码仓库',
    createDesc: '创建一个新的业务系统，用于组织和管理相关模块',
    name: '系统名称',
    namePlaceholder: '例如：4S 店运营管理系统',
    slug: '系统标识',
    slugPlaceholder: '例如：4s-store-management',
    description: '系统描述',
    descriptionPlaceholder: '可选',
    repoUrl: '代码仓库地址',
    repoUrlPlaceholder: '例如：https://github.com/org/repo',
    repoUrlHint: '配置后，节点的相对代码关联可一键跳转到 GitHub/GitLab',
    repoBranch: '默认分支',
    repoBranchPlaceholder: '默认 main',
    noTeam: '未选择团队',
    createSuccess: '创建成功',
    createFailed: '创建失败',
    saveSuccess: '保存成功',
    saveFailed: '保存失败',
    deleteSuccess: '删除成功',
    deleteFailed: '删除失败',
    saving: '保存中...',
    creating: '创建中...'
  },
  notifications: {
    title: '通知中心',
    unreadCount: '未读通知 {count} 条',
    showUnreadOnly: '仅显示未读',
    showAll: '显示全部',
    markAllRead: '全部已读',
    clear: '清空',
    clearConfirm: '确定要清空所有通知吗？',
    allMarkedRead: '全部标记为已读',
    empty: '暂无通知'
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
  },
  systems: {
    title: 'System Management',
    subtitle: 'Create and manage business systems and modules',
    importFromGit: 'Import from Git',
    aiBatch: 'AI batch suggestions',
    createSystem: 'Create system',
    emptyTitle: 'No systems yet',
    emptyDesc: 'Create your first system to start managing your business logic',
    modulesCount: '{count} modules',
    enterSystem: 'Open system',
    deleteConfirm: 'Delete system "{name}"?',
    editTitle: 'Edit system',
    createTitle: 'Create new system',
    editDesc: 'Update the system info and its linked code repository',
    createDesc: 'Create a new business system to organize and manage related modules',
    name: 'System name',
    namePlaceholder: 'e.g. 4S Store Operations',
    slug: 'System slug',
    slugPlaceholder: 'e.g. 4s-store-management',
    description: 'Description',
    descriptionPlaceholder: 'Optional',
    repoUrl: 'Repository URL',
    repoUrlPlaceholder: 'e.g. https://github.com/org/repo',
    repoUrlHint: 'Once set, relative code references on nodes link directly to GitHub/GitLab',
    repoBranch: 'Default branch',
    repoBranchPlaceholder: 'Defaults to main',
    noTeam: 'No team selected',
    createSuccess: 'Created',
    createFailed: 'Create failed',
    saveSuccess: 'Saved',
    saveFailed: 'Save failed',
    deleteSuccess: 'Deleted',
    deleteFailed: 'Delete failed',
    saving: 'Saving...',
    creating: 'Creating...'
  },
  notifications: {
    title: 'Notifications',
    unreadCount: '{count} unread',
    showUnreadOnly: 'Unread only',
    showAll: 'Show all',
    markAllRead: 'Mark all read',
    clear: 'Clear',
    clearConfirm: 'Clear all notifications?',
    allMarkedRead: 'All marked as read',
    empty: 'No notifications'
  }
}

export const messages = { zh, en } as const
export type Lang = keyof typeof messages
