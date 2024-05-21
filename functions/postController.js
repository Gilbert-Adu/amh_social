const Post = require("../db/models/post");
const User = require("../db/models/user");


exports.createPost = async (req, res) => {
    try {

        const {title, desc, altText, content, userId} = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({message: 'User not found'});

        }

        const post = new Post({
            title,
            desc,
            altText,
            content,
            user: userId
        });

        await post.save();
        res.status(201).json(post)

    }catch(error) {
        console.error(error);
        res.status(500).json({message: "Internal server error"})
    }
};