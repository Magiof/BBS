const express = require("express");
const { connect } = require("http2");
const Posts = require("../schemas/posts")
const router = express.Router(); 
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/auth-middlware")
const User = require("../models/user");
const posts = require("../schemas/posts");
const Comment = require("../schemas/comments");

//글 전체 페이지 조회
router.get("/", async (req, res) => {
    const { title } = req.query;
    const posts = await Posts.find( ).sort('-createdAt');
    res.render('main',{posts}
    );
  });

//상세 페이지 조회
router.get("/detail/:seq", async (req, res) => {
    const { seq } = req.params;
    const {nickname} = req.query;
    if(nickname==undefined) nickname='비회원';

    const [detail] = await Posts.find({ seq: Number(seq) })
    const comments = await Comment.find({ postSeq: Number(seq) }).sort('-createdAt');
    res.render('detail',{detail, comments,nickname}
    );
});

//회원가입 화면 렌더
router.get('/register',function(req,res){
  res.render('register');
});

//회원가입라우터
router.post("/register", async (req,res)=>{
  const {nickname, email, password, confirmPassword} = req.body;
  const nameCheck = /^[0-9a-zA-Z]{3,20}$/ // 영문,숫자로 이루어진 3~20자 
  const pwdCheck = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z!@#$%^&*]{4,20}$/ //4~20자 영문,숫자 필수, 특수기호 사용 가능
  if( nickname.length===0 || !nameCheck.test(email)  || !pwdCheck.test(password) ){
      res.status(400).send({
          errorMessage: '양식을 확인하세요.',
      });
      return;
  }
  if(password.indexOf(email) > -1 || password.indexOf(nickname) > -1){
      res.status(400).send({
          errorMessage: '비밀번호는 아이디 또는 닉네임을 포함할 수 없습니다.',
      });
      return;
  };
  if(password !== confirmPassword){
      res.status(400).send({
          errorMessage: '패스워드가 확인란과 동일하지 않습니다.',
  });
  return;
  }

  const existUsers = await User.find({
      $or: [{email}, {nickname}],
  });
  if (existUsers.length) {
      res.status(400).send({
          errorMessage: '중복된 닉네임 입니다.',
      });
      return;
  }

  const user = new User({ email, nickname, password});
  await user.save();

  res.status(201).send();
});
//로그인페이지 렌더
router.get('/login',function(req,res){
    res.render('login');
  });
//사용자인증
router.post("/auth", async (req, res)=>{
  const {email, password } = req.body;

  const user = await User.findOne({email, password}).exec();

  if(!user){
      res.status(400).send({
          errorMessage:'이메일 또는 패스워드가 잘못 됐습니다.',
      });
      return;
  };

  const token = jwt.sign({ userId: user.userId}, "my-secret-key");
  res. send({
      token,
  })

});
//내 정보 조회 API
router.get("/users/me", authMiddleware, async(req, res) =>{
  const { user } = res.locals;
  
  res.send({
      user: {              //user만 해도 되지만 패스워드가 포함돼있기 때문에 email과 nickname을 적음 
          email: user.email,
          nickname: user.nickname,
      }, 
  });
})

// router.get("/comment/toggle", authMiddleware, async(req, res) =>{
//   const { user } = res.locals;
//   const {}
  
//   res.send({
//       user: {              
//           nickname: user.nickname,
//       }, 
//   });
// })

//글 작성 페이지 렌더
router.get("/write", async(req, res)=>{
    res.render('write',{success:true})
  })
//글 작성
  router.post("/write", authMiddleware, async (req, res) => {
    const { title, content } = req.body;
    const {user} = res.locals
    if(title.length===0 || content.length === 0){
        res.status(400).send({
            errorMessage:'제목과 내용을 채워주세요.',
        });
        return;
    };
    const createdPosts = await posts.create({ title, content, authorName: user.nickname });
    res.json(createdPosts);
  });
  //댓글 작성
  router.post("/comment/write/", authMiddleware, async (req, res) => {
    const { comment, postSeq } = req.body;
    const {user} = res.locals
    if(comment.length === 0){
        res.status(400).send({
            errorMessage:'댓글 내용을 채워주세요.',
        });
        return;
    };
    await Comment.create({ postSeq: Number(postSeq), comment, commenter: user.nickname });
    res.json({});
  });
 //댓글 수정
  router.patch("/detail/:_id", async (req, res)=>{
    const {comment, _id} = req.body;
    if(comment.length === 0){
      res.status(400).send({
          errorMessage:'댓글 내용을 채워주세요.',
      });
      return;
  };
    await Comment.updateOne({_id:_id}, { $set: { comment:comment } })
    console.log({comment, _id})
    res.json({ success: true })
  });
//댓글 삭제
  router.delete("/detail/:_id", async (req, res)=>{
    const { _id } = req.body;
    await Comment.deleteOne({_id:_id});
    res.json({ success: true });
  });

//글 수정
router.get("/modify/:seq", async (req, res) => {
    const { seq } = req.params;
  
    const [modify] = await Posts.find({ seq: Number(seq) })
  
    res.render('modify',{modify}
    );
  });
  
  router.patch("/modify/:seq", async (req, res)=>{
    
    const {content, title, seq} = req.body;
    await Posts.updateOne({seq: Number(seq)}, { $set: { title, content, seq} })
    res.json({ success: true })
  });

//글 삭제
router.delete("/modify/:articleId",async (req, res) => {
    const { seq } = req.body;
      await Posts.deleteOne({ seq: Number(seq) }); // articleId 일치하는 것으로 삭제
    res.json({success : true});
  });
  
module.exports = router;