import {useEffect} from "react";
import {history} from "./history";
import queryString from "query-string";
import {fetchTopicSummary, loadGameboard} from "../state/actions";
import {useDispatch, useSelector} from 'react-redux'
import {AppState} from "../state/reducers";
import {determineGameboardHistory, determineNextGameboardItem, makeAttemptAtGameboardHistory} from "./gameboards";
import {TAG_ID} from "./constants";
import {determineNextTopicContentLink, determineTopicHistory, makeAttemptAtTopicHistory} from "./topics";
import {determineExamBoardFrom} from "./examBoard";

export interface LinkInfo {title: string; to: string}
export interface PageNavigation {
    collectionType?: "Gameboard" | "Topic";
    breadcrumbHistory: LinkInfo[];
    backToCollection?: LinkInfo;
    nextItem?: LinkInfo;
    queryParams?: string;
}

const defaultPageNavigation = {
    breadcrumbHistory: [],
};

export const useNavigation = (currentDocId: string): PageNavigation => {
    const queryParams = queryString.parse(history.location.search);
    const dispatch = useDispatch();

    useEffect(() => {
        if (queryParams.board) dispatch(loadGameboard(queryParams.board as string));
        if (queryParams.topic) dispatch(fetchTopicSummary(queryParams.topic as TAG_ID));
    }, [queryParams.board, queryParams.topic, dispatch]);

    const currentGameboard = useSelector((state: AppState) => state && state.currentGameboard);
    const currentTopic = useSelector((state: AppState) => state && state.currentTopic);
    const userPreferences = useSelector((state: AppState) => state && state.userPreferences);

    if (queryParams.board) {
        const gameboardHistory = (currentGameboard && queryParams.board === currentGameboard.id) ?
            determineGameboardHistory(currentGameboard) :
            makeAttemptAtGameboardHistory(queryParams.board as string);
        return {
            collectionType: "Gameboard",
            breadcrumbHistory: gameboardHistory,
            backToCollection: gameboardHistory.slice(-1)[0],
            nextItem: determineNextGameboardItem(currentGameboard, currentDocId),
            queryParams: history.location.search,
        }
    }

    if (queryParams.topic) {
        const examBoard = determineExamBoardFrom(userPreferences);
        const topicHistory = (currentTopic && currentTopic.id && queryParams.topic === currentTopic.id.slice("topic_summary_".length)) ?
            determineTopicHistory(currentTopic) :
            makeAttemptAtTopicHistory();
        return {
            collectionType: "Topic",
            breadcrumbHistory: topicHistory,
            backToCollection: topicHistory.slice(-1)[0],
            nextItem: determineNextTopicContentLink(currentTopic, currentDocId, examBoard),
            queryParams: history.location.search,
        }
    }

    return defaultPageNavigation;
};