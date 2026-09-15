const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const ALLOWED_BOARDS = ['class1k', 'burial'];

function boardFile(boardId) {
  return path.join(DATA_DIR, `${boardId}.json`);
}

function readBoard(boardId) {
  const file = boardFile(boardId);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify({ posts: [] }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return { posts: [] };
  }
}

function writeBoard(boardId, data) {
  const file = boardFile(boardId);
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

/* 读取板块全部帖子 */
app.get('/api/:boardId', (req, res) => {
  const { boardId } = req.params;
  if (!ALLOWED_BOARDS.includes(boardId)) {
    return res.status(404).json({ error: 'Unknown board' });
  }
  res.json(readBoard(boardId));
});

/* 执行一个操作 */
app.post('/api/:boardId/action', (req, res) => {
  const { boardId } = req.params;
  if (!ALLOWED_BOARDS.includes(boardId)) {
    return res.status(404).json({ error: 'Unknown board' });
  }

  const { type, payload } = req.body;
  const data = readBoard(boardId);
  let posts = data.posts || [];

  try {
    switch (type) {
      case 'addPost':
        posts.unshift(payload.post);
        break;

      case 'deletePost':
        posts = posts.filter(p => p.id !== payload.postId);
        break;

      case 'toggleLike': {
        const post = posts.find(p => p.id === payload.postId);
        if (post) {
          if (post.liked) {
            post.likes = Math.max(0, (post.likes || 0) - 1);
            post.liked = false;
          } else {
            post.likes = (post.likes || 0) + 1;
            post.liked = true;
          }
        }
        break;
      }

      case 'addComment': {
        const post = posts.find(p => p.id === payload.postId);
        if (post) {
          if (!post.comments) post.comments = [];
          post.comments.push(payload.comment);
        }
        break;
      }

      case 'addReply': {
        const post = posts.find(p => p.id === payload.postId);
        if (post) {
          const comment = (post.comments || []).find(c => c.id === payload.commentId);
          if (comment) {
            if (!comment.replies) comment.replies = [];
            comment.replies.push(payload.reply);
          }
        }
        break;
      }

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }

  writeBoard(boardId, { posts });
  res.json({ posts });
});

app.listen(PORT, () => {
  console.log(`\n  ✦ 告白墙服务器已启动`);
  console.log(`  ✦ 本地访问: http://localhost:${PORT}`);
  console.log(`  ✦ 数据目录: ${DATA_DIR}\n`);
});