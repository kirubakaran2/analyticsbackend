const Performance = require("../Schema/performance");
const Exam = require("../Schema/events");

const getGraphData = async (studentId) => {
    const performance = await Performance.find({ studentid: studentId });
    let numberOfMcq = 0;
    let numberOfCod = 0;
    let numberOfBot = 0;
    let overallpoint = 0;
    let point = 0;
    const OverAllPerf = [];

    const addedExamIds = new Set(); 

    for (let perf of performance) {
        if (perf.category === 'mcq') {
            numberOfMcq++;
        } else if (perf.category === 'coding') {
            numberOfCod++;
        } else if (perf.category === 'both') {
            numberOfBot++;
        }

        point += perf.obtainpoint;

        const exam = await Exam.findOne({ _id: perf.examid });
        if (!exam) {
            console.error(`Exam not found for exam ID: ${perf.examid}`);
            continue;
        }

        overallpoint += exam.overallRating;

        // Check if examId is already added
        if (!addedExamIds.has(exam._id.toString())) {
            OverAllPerf.push({
                examId: exam._id,
                examName: exam.title,
                obtainpoint: perf.obtainpoint
            });
            addedExamIds.add(exam._id.toString()); // Add examId to set
        }
    }

    return {
        numberOfMcq,
        numberOfCod,
        numberOfBot,
        overallpoint,
        point,
        OverAllPerf
    };
};

module.exports = { getGraphData };
