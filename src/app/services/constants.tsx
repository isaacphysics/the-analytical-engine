import Remarkable from "remarkable";
import {AllTopicsDTO, LinkType, TopicDTO} from "../../IsaacAppTypes";

export const API_VERSION: string = process.env.REACT_APP_API_VERSION || "any";

/*
 * Configure the api provider with the server running the API:
 * No need if we want to use the same server as the static content.
 */
let apiPath: string = `${document.location.origin}/api/${API_VERSION}/api`;
if (document.location.hostname === "localhost") {
    apiPath = "http://localhost:8080/isaac-api/api";
}
export const API_PATH: string = apiPath;
export const MARKDOWN_RENDERER: Remarkable = new Remarkable();

export enum ACTION_TYPES {
    TEST_ACTION = "TEST_ACTION",

    USER_UPDATE_REQUEST = "USER_UPDATE_REQUEST",
    USER_UPDATE_FAILURE = "USER_UPDATE_FAILURE",
    USER_LOG_IN_REQUEST = "USER_LOG_IN_REQUEST",
    USER_LOG_IN_RESPONSE_SUCCESS = "USER_LOG_IN_RESPONSE_SUCCESS",
    USER_LOG_OUT_REQUEST = "USER_LOG_OUT_REQUEST",
    USER_LOG_OUT_RESPONSE_SUCCESS = "USER_LOG_OUT_RESPONSE_SUCCESS",
    AUTHENTICATION_REQUEST_REDIRECT = "AUTHENTICATION_REQUEST_REDIRECT",
    AUTHENTICATION_REDIRECT = "AUTHENTICATION_REDIRECT",
    AUTHENTICATION_HANDLE_CALLBACK = "AUTHENTICATION_HANDLE_CALLBACK",

    DOCUMENT_REQUEST = "DOCUMENT_REQUEST",
    DOCUMENT_RESPONSE_SUCCESS = "DOCUMENT_RESPONSE_SUCCESS",
    DOCUMENT_RESPONSE_FAILURE = "DOCUMENT_RESPONSE_FAILURE",

    QUESTION_REGISTRATION = "QUESTION_REGISTRATION",
    QUESTION_DEREGISTRATION = "QUESTION_DEREGISTRATION",
    QUESTION_ATTEMPT_REQUEST = "QUESTION_ATTEMPT_REQUEST",
    QUESTION_ATTEMPT_RESPONSE_SUCCESS = "QUESTION_ATTEMPT_RESPONSE_SUCCESS",
    QUESTION_ATTEMPT_RESPONSE_FAILURE = "QUESTION_ATTEMPT_RESPONSE_FAILURE",
    QUESTION_SET_CURRENT_ATTEMPT = "QUESTION_SET_CURRENT_ATTEMPT",

    TOPIC_REQUEST = "TOPIC_REQUEST",
    TOPIC_RESPONSE_SUCCESS = "TOPIC_RESPONSE_SUCCESS",

    GAMEBOARD_REQUEST = "GAMEBOARD_REQUEST",
    GAMEBOARD_RESPONSE_SUCCESS = "GAMEBOARD_RESPONSE_SUCCESS",

    ASSIGNMENTS_REQUEST = "ASSIGNMENTS_REQUEST",
    ASSIGNMENTS_RESPONSE_SUCCESS = "ASSIGNMENTS_RESPONSE_SUCCESS",
}

export enum EXAM_BOARDS {
    AQA = "AQA",
    OCR = "OCR"
}

export const ALL_TOPICS: AllTopicsDTO = {
    Theory: {
        "GCSE to A-Level transition": {
            "Boolean logic": {destination: "", comingSoon: true},
            "Programming concepts": {destination: "", comingSoon: true},
            "Networking": {destination: "", comingSoon: true, onlyFor: [EXAM_BOARDS.OCR]},
            "Data Representation": {destination: "", comingSoon: true},
            "Systems": {destination: "", comingSoon: true},
        },
        "Data structures and algorithms": {
            "Searching, sorting & pathfinding": {destination: "", comingSoon: true},
            "Complexity": {destination: "", comingSoon: true},
            "Models of computation": {destination: "", comingSoon: true, onlyFor: [EXAM_BOARDS.OCR]},
            "Planning and debugging": {destination: "", comingSoon: true},
            "Data structures (theory)": {destination: "", comingSoon: true},
        },
        "Computer networks": {
            "Security": {destination: "", comingSoon: true},
            "Network structure": {destination: "", comingSoon: true},
            "Network hardware": {destination: "", comingSoon: true},
            "Communication": {destination: "", comingSoon: true},
            "Internet": {destination: "", comingSoon: true},
        },
        "Computer systems": {
            "Boolean logic": {destination: "/topics/boolean_logic"},
            "Architecture": {destination: "", comingSoon: true},
            "Hardware": {destination: "", comingSoon: true},
            "Operating systems and software": {destination: "", comingSoon: true},
            "Translators": {destination: "", comingSoon: true},
            "Programming languages": {destination: "", comingSoon: true},
        },
        "Data and information": {
            "Number systems": {destination: "", comingSoon: true},
            "Number bases": {destination: "", comingSoon: true},
            "Representation": {destination: "", comingSoon: true},
            "Transmission": {destination: "", comingSoon: true},
            "Databases": {destination: "", comingSoon: true},
            "Big Data": {destination: "", comingSoon: true},
            "Compression": {destination: "", comingSoon: true},
            "Encryption": {destination: "", comingSoon: true},
        },
    },
    Programming: {
        "Functional programming": {
            "Functions": {destination: "", comingSoon: true},
            "Lists": {destination: "", comingSoon: true},
            "Higher order functions": {destination: "", comingSoon: true},
        },
        "Object oriented programming": {
            "Creating objects": {destination: "", comingSoon: true},
            "OOP concepts": {destination: "", comingSoon: true},
            "Class diagrams": {destination: "", comingSoon: true},
        },
        "Procedural programming": {
            "Programming concepts": {destination: "", comingSoon: true},
            "Subroutines": {destination: "/topics/subroutines"},
            "Files": {destination: "", comingSoon: true, onlyFor: [EXAM_BOARDS.OCR]},
            "Structure & robustness": {destination: "", comingSoon: true},
            "Data structures (implementation)": {destination: "", comingSoon: true},
            "Recursion": {destination: "", comingSoon: true},
            "String manipulation": {destination: "", comingSoon: true},
            "GUIs": {destination: "", comingSoon: true},
            "Software engineering principles": {destination: "", comingSoon: true},
        }
    }
};

export const TOPICS: {[topicName: string]: TopicDTO} = {
    "subroutines": {
        title: "Subroutines",
        description: {
            encoding: "markdown",
            value: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer ornare euismod purus, vitae" +
                "tincidunt urna finibus in. Pellentesque habitant morbi tristique senectus et netus et malesuada fames " +
                "ac turpis egestas. In bibendum, tellus ut vestibulum tempor, ex urna sollicitudin diam, id " +
                "sollicitudin mauris est at arcu. Quisque ullamcorper nisl sit amet massa fermentum, nec interdum velit " +
                "luctus. Aenean turpis tortor, dictum a mauris ut, rutrum suscipit massa. Ut varius mauris tortor, " +
                "vitae interdum erat interdum eget."
        },
        contentLinks: [
            {
                value: "Defining and calling",
                destination: "/curriculum/defining_and_calling",
                type: LinkType.CURRICULUM,
                comingSoon: true
            },
            {
                value: "Types of subroutines",
                destination: "/curriculum/types_of_subroutines",
                type: LinkType.CURRICULUM,
            },
            {
                value: "Advantages of using subroutines",
                destination: "/curriculum/advantages_of_subroutines",
                type: LinkType.CURRICULUM,
                comingSoon: true
            },
            {
                value: "Question section 1",
                destination: "/questions/advantages_of_subroutines",
                type: LinkType.QUESTION,
            },
            {
                value: "Using parameters and arguments",
                destination: "/curriculum/using_paramaters_and_arguments",
                type: LinkType.CURRICULUM,
                comingSoon: true
            },
        ]
    }
};
