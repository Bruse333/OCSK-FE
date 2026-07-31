// Token 存取工具（基于 localStorage）
// 后续登录页面登录成功后调用 setToken 即可，所有请求会自动带上 Token

const TOKEN_KEY = 'ocskill_token'
const USERNAME_KEY = 'ocskill_username'
const PRIVILEGE_KEY = 'ocskill_privilege'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  return localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  return localStorage.removeItem(TOKEN_KEY)
}

export function getUsername() {
  return localStorage.getItem(USERNAME_KEY)
}

export function setUsername(username) {
  return localStorage.setItem(USERNAME_KEY, username)
}

export function removeUsername() {
  return localStorage.removeItem(USERNAME_KEY)
}

export function getPrivilege() {
  const v = localStorage.getItem(PRIVILEGE_KEY)
  return v ? parseInt(v) : 1
}

export function setPrivilege(privilege) {
  return localStorage.setItem(PRIVILEGE_KEY, privilege)
}

export function removePrivilege() {
  return localStorage.removeItem(PRIVILEGE_KEY)
}
