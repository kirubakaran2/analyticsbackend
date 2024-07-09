const mongoose = require("mongoose");
const Section = require("../Schema/playgroundSections");
const Playground = require('../Schema/playgroundQn');
const SuperAdmin = require("../Schema/superadmin");
const User = require("../Schema/user"); // Ensure User schema is required for profileID function
const jwt = require("jsonwebtoken");
const secret = process.env.secret || "SuperK3y";

async function profileID(token) {
    var tok = token.headers.authorization;
    var id;
    try {
        tok = tok.slice(7, tok.length);
        id = jwt.verify(tok, secret);
    } catch (err) {
        id = null;
    }

    const user = await User.findOne({ _id: id.id });
    if (user) {
        return user;
    } else {
        return null;
    }
}

async function saprofileID(token) {
    var tok = token.headers.authorization;
    var id;
    try {
        tok = tok.slice(7, tok.length);
        id = jwt.verify(tok, secret);
    } catch (err) {
        id = null;
    }

    const user = await SuperAdmin.findOne({ _id: id.id });
    if (user) {
        return user;
    } else {
        return null;
    }
}

exports.newPlayground = async (req, res) => {
    try {
        // Extracting the super admin's profile from the token
        const superAdmin = await saprofileID(req);

        if (!superAdmin) {
            return res.status(401).json({ error: "Unauthorized access" });
        }

        // Extracting college ID from super admin profile
        const collegeId = superAdmin.college;
        // console.log(collegeId);

        // Extracting other details from the request body
        const { title, date, start, end, department, questions } = req.body;
        var overAllPoint = 0;
        var overDuration = 0;
        const { name, category, hours, minutes, qn } = questions;
        let duration = (hours * 60) + minutes;
        overDuration = (duration === undefined || duration === null) ? null : duration;

        // Calculating the overall points
        for (let question of qn) {
            for (let out of question.output) {
                overAllPoint += out.rating;
            }

            for (let test of question.testcase) {
                overAllPoint += test.rating;
            }
        }

        // Creating a new section
        let sect;
        if (duration === null || hours === undefined || minutes === undefined) {
            sect = await Section({
                name: name,
                category: category,
                questions: qn
            });
        } else {
            sect = await Section({
                name: name,
                category: category,
                time: duration,
                questions: qn
            });
        }

        let sectionID = await sect.save();

        // Creating a new playground
        var newExam = await Playground({
            title: title,
            category: category,
            date: date,
            start: start,
            end: end,
            sections: sectionID._id,
            department: department,
            college: collegeId, 
            overallRating: overAllPoint
        });

        // Saving the playground
        await newExam.save();

        return res.json({ response: `Added new playground` });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ response: `Something wrong.\nBacktrack\n${err}` });
    }
};
