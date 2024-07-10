const bcrypt = require("bcrypt");
const SuperAdmin = require("../Schema/admin");

exports.user = async(req, res) => {
    const { userID } = req.params;
    try {
        const userOld = await SuperAdmin.findOne({ _id: userID }, { password: 0 });
        if (userOld) {
            return res.json({
                username: userOld.username,
                name: userOld.name,
                image: userOld.image,
                email: userOld.email
            });
        } else {
            return res.json({ user: "Not found" });
        }
    } catch (error) {
        return res.json({ status: "Error", error: error.message });
    }
}

exports.personal = async(req, res) => {
    const { userID } = req.params;
    try {
        const userOld = await SuperAdmin.findOne({ _id: userID });

        if (!userOld) {
            return res.json({ user: "Not found" });
        }

        const { name, email, rollno, imageData } = req.body;
        const UpdateUser = {
            name: name === undefined || name === null ? userOld.name : name,
            username: userOld.username,
            image: imageData === undefined || imageData === null ? userOld.image : imageData
        };

        await SuperAdmin.findOneAndUpdate({ _id: userID }, UpdateUser, { new: true });
        return res.json({ status: "Updated" });
    } catch (error) {
        return res.json({ status: "Error", error: error.message });
    }
}

exports.security = async(req, res) => {
    const { userID } = req.params;
    try {
        const userOld = await SuperAdmin.findOne({ _id: userID });

        if (!userOld) {
            return res.json({ user: "Not found" });
        }

        const { oldpassword, password } = req.body;
        const isMatch = await bcrypt.compare(oldpassword, userOld.password);
        if (isMatch) {
            const encPassword = await bcrypt.hash(password, 5);
            await SuperAdmin.findOneAndUpdate(
                { _id: userID },
                { $set: { password: encPassword } },
                { new: true }
            );
            return res.json({ status: "Updated" });
        } else {
            return res.json({ status: "Incorrect password" });
        }
    } catch (error) {
        return res.json({ status: "Error", error: error.message });
    }
}
