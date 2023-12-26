const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");

const app = express();
const port = 3001;

const connection = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "12345",
  database: "nodeboard",
  port: 3306,
});

function createTable() {
  connection.query(`
  CREATE TABLE IF NOT EXISTS board (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    likes INT DEFAULT 0
  )
`);
}

connection.connect((error) => {
  if (error) {
    console.log("데이터베이스 연결에 문제가 생겼습니다!!");
  } else {
    console.log("데이터베이스와 연결되었습니다!!");
    createTable();
  }
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 게시물 추가 (POST)
app.post("/", (req, res) => {
  const query = "INSERT INTO board (title, content) VALUES (?, ?)";

  connection.query(
    query,
    [req.body.title, req.body.content],
    (err, results) => {
      res.json({
        postId: results.insertId,
      });
    }
  );
});

// 모든 게시물 가져오기 (GET)
app.get("/", (req, res) => {
  const query = "SELECT id, title, content, time FROM board";

  connection.query(query, (err, results) => {
    res.json(results);
  });
});

// 특정 게시물 가져오기 (GET)
app.get("/:boardId", (req, res) => {
  const query =
    "SELECT id, title, content, time, likes FROM board WHERE id = ?";

  connection.query(query, [req.params.boardId], (err, results) => {
    if (results.length === 0) {
      return res.status(404).json({ error: "게시물을 찾을 수 없습니다." });
    }

    res.json(results[0]);
  });
});

// 게시물 수정 (PUT)
app.put("/:boardId", (req, res) => {
  const updateQuery = "UPDATE board SET title = ?, content = ? WHERE id = ?";
  const selectQuery = "SELECT * FROM board WHERE id = ?";

  connection.query(selectQuery, [req.params.boardId], (err, results) => {
    if (err || results.length == 0) {
      return res.status(400).json({ error: "수정할 board가 없습니다." });
    }

    connection.query(
      updateQuery,
      [req.body.title, req.body.content, req.params.boardId],
      (err) => {
        res.json({ message: "수정완료" });
      }
    );
  });
});

// 좋아요 누르기 (POST)
app.post("/like/:boardId", (req, res) => {
  const likeQuery = "UPDATE board SET likes = likes + 1 WHERE id = ?";
  const selectQuery = "SELECT * FROM board WHERE id = ?";

  connection.query(selectQuery, [req.params.boardId], (err, results) => {
    if (err || results.length == 0) {
      return res
        .status(400)
        .json({ error: "좋아요를 누를 board가 없는데 난 어떡하라고요.." });
    }

    connection.query(likeQuery, [req.params.boardId], (err) => {
      res.json({ message: "좋아요 누르기 완료" });
    });
  });
});

// 게시물 삭제 (DELETE)
app.delete("/:boardId", (req, res) => {
  const deleteQuery = "DELETE FROM board WHERE id = ?";

  connection.query(deleteQuery, [req.params.boardId], (err, results) => {
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "삭제할 board가 없습니다." });
    }

    res.json({ message: "삭제 완료" });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
