export const state = () => ({
  open: false
})

export const mutations = {
  toggle(state, open = null) {
    state.open = open === null ? !state.open : open
  }
}
