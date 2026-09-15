/* 与服务器的通信模块 */
const API_BASE = ''; // 同源部署留空；跨域时写完整地址，如 'http://192.168.1.10:3000'

const WallAPI = {
  async load(boardId) {
    const res = await fetch(`${API_BASE}/api/${boardId}`);
    if (!res.ok) throw new Error('加载失败');
    const data = await res.json();
    return data.posts || [];
  },

  async action(boardId, type, payload) {
    const res = await fetch(`${API_BASE}/api/${boardId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload })
    });
    if (!res.ok) throw new Error('操作失败');
    const data = await res.json();
    return data.posts || [];
  },

  addPost(boardId, post) {
    return this.action(boardId, 'addPost', { post });
  },
  toggleLike(boardId, postId) {
    return this.action(boardId, 'toggleLike', { postId });
  },
  addComment(boardId, postId, comment) {
    return this.action(boardId, 'addComment', { postId, comment });
  },
  addReply(boardId, postId, commentId, reply) {
    return this.action(boardId, 'addReply', { postId, commentId, reply });
  }
};