import {combineReducers} from "redux";
import {Action} from "../../../IsaacAppTypes";
import {ACTION_TYPE} from "../../services/constants";
import {
    activeAuthorisations,
    activeModals,
    adminContentErrors,
    adminEmailTemplate,
    adminStats,
    adminUserGet,
    adminUserSearch,
    assignments,
    assignmentsByMe,
    boards,
    concepts,
    constants,
    contentVersion,
    currentGameboard,
    currentTopic,
    doc,
    error,
    fasttrackConcepts,
    fragments,
    gameboardEditorQuestions,
    glossaryTerms,
    graphSketcherSpec,
    groupMemberships,
    groupProgress,
    groups,
    mainContentId,
    myAnsweredQuestionsByDate,
    myProgress,
    news,
    notifications,
    otherUserAuthorisations,
    printingSettings,
    progress,
    questions,
    search,
    tempExamBoard,
    testQuestions,
    toasts,
    totpChallengePending,
    totpSharedSecret,
    user,
    userAnsweredQuestionsByDate,
    userAuthSettings,
    userPreferences,
    userProgress,
    userSchoolLookup,
    wildcards
} from "./reducers";
import {
    currentEvent,
    eventBookings,
    eventBookingsForAllGroups,
    eventBookingsForGroup,
    eventMapData,
    eventOverviews,
    events
} from "./events";
import {
    quizzes
} from "./quizzes";

const appReducer = combineReducers({
    user,
    userAuthSettings,
    userPreferences,
    myProgress,
    myAnsweredQuestionsByDate,
    userAnsweredQuestionsByDate,
    userSchoolLookup,
    userProgress,
    adminUserGet,
    adminUserSearch,
    adminContentErrors,
    adminStats,
    adminEmailTemplate,
    activeAuthorisations,
    otherUserAuthorisations,
    totpSharedSecret,
    totpChallengePending,
    groupMemberships,
    constants,
    notifications,
    doc,
    questions,
    currentTopic,
    currentGameboard,
    tempExamBoard,
    wildcards,
    gameboardEditorQuestions,
    assignments,
    contentVersion,
    search,
    error,
    toasts,
    activeModals,
    groups,
    boards,
    assignmentsByMe,
    progress,
    news,
    fragments,
    glossaryTerms,
    testQuestions,
    printingSettings,
    concepts,
    fasttrackConcepts,
    graphSketcherSpec,
    mainContentId,
    groupProgress,

    // Events
    events,
    currentEvent,
    eventOverviews,
    eventMapData,
    eventBookings,
    eventBookingsForGroup,
    eventBookingsForAllGroups,

    // Quizzes
    quizzes,

});

export type AppState = ReturnType<typeof appReducer> | undefined;

export const rootReducer = (state: AppState, action: Action) => {
    if (action.type === ACTION_TYPE.USER_LOG_OUT_RESPONSE_SUCCESS || action.type === ACTION_TYPE.USER_LOG_OUT_EVERYWHERE_RESPONSE_SUCCESS || action.type === ACTION_TYPE.USER_CONSISTENCY_ERROR) {
        state = undefined;
    }
    return appReducer(state, action);
};
