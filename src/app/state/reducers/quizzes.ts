import {Action} from "../../../IsaacAppTypes";
import {ACTION_TYPE} from "../../services/constants";
import {ContentSummaryDTO} from "../../../IsaacApiTypes";

type QuizzesState = {quizzes: ContentSummaryDTO[]; total: number} | null;
export const quizzes = (quizzes: QuizzesState = null, action: Action) => {
    switch (action.type) {
        case ACTION_TYPE.QUIZZES_RESPONSE_SUCCESS:
            return {quizzes: action.quizzes.results as ContentSummaryDTO[], total: action.quizzes.totalResults as number};
        default:
            return quizzes;
    }
};
