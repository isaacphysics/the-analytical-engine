import {GameboardDTO, GameboardItem, IsaacFastTrackQuestionPageDTO} from "../../../IsaacApiTypes";
import queryString from "query-string";
import {useDispatch, useSelector} from "react-redux";
import {AppState} from "../../state/reducers";
import React, {useEffect} from "react";
import {fetchFasttrackConcepts} from "../../state/actions";
import * as RS from "reactstrap";
import {selectors} from "../../state/selectors";
import {Link} from "react-router-dom";
import {useDeviceSize} from "../../services/device";

type QuestionLevel = "topTen" | "upper" | "lower";

type LevelTag = 'ft_top_ten' | 'ft_upper' | 'ft_lower';
const fastTrackStates: LevelTag[] = ['ft_top_ten', 'ft_upper', 'ft_lower'];

function getFastTrackLevel(tags?: string[]): LevelTag {
    if (!tags) throw new Error("Unknown level for undefined tags");
    for (let state of fastTrackStates) {
        if (tags.includes(state)) {
            return state;
        }
    }
    throw new Error("Unknown level for tags:" + tags.join(","));
}

type ConceptLevel = "upperLevelQuestions" | "lowerLevelQuestions";
const conceptLevels: ConceptLevel[] = ["upperLevelQuestions", "lowerLevelQuestions"];

interface ConceptLevelQuestions {
    upperLevelQuestions: GameboardItem[];
    lowerLevelQuestions: GameboardItem[];
}

function categoriseConceptQuestions(conceptQuestions: GameboardItem[]): ConceptLevelQuestions {
    return {
        upperLevelQuestions: conceptQuestions.filter(question => getFastTrackLevel(question.tags) === 'ft_upper'),
        lowerLevelQuestions: conceptQuestions.filter(question => getFastTrackLevel(question.tags) === 'ft_lower'),
    };
}

interface AugmentedQuestion {
    id: string;
    title: string;
    fastTrackLevel: LevelTag;
    isConcept: boolean;
    isCurrentQuestion: boolean;
    isCompleted: boolean;
    href: string;
    hexagonTitle: string;
    questionPartStates?: string[];
}

function moveTo(x: number, y: number) {
    return 'M' + x + ' ' + y;
}

function line(x: number, y: number) {
    return 'L' + x + ' ' + y;
}

function calculateDashArray<T>(elements: T[] | undefined, evaluator: (t: T) => boolean, perimiterLength: number) {
    if (elements === undefined) {
        return null;
    }
    let sectionLength = perimiterLength / elements.length;
    let recordingDash = true;
    let lengthCollector = 0;
    let dashArray = [];
    for (let element of elements) {
        let shouldRecordDash = evaluator(element);
        if (shouldRecordDash === recordingDash) {
            lengthCollector += sectionLength;
        } else {
            dashArray.push(lengthCollector);
            recordingDash = !recordingDash;
            lengthCollector = sectionLength;
        }
    }
    dashArray.push(lengthCollector);
    return dashArray.join(',');
}

function calculateProgressBarHeight(questionLevel: LevelTag, hexagonQuarterHeight: number, hexagonPadding: number, progressBarPadding: number) {
    let numberOfHexagonRows = {"ft_top_ten": 1, "ft_upper": 2, "ft_lower": 3}[questionLevel];
    return 2 * progressBarPadding + 4 * hexagonQuarterHeight + (numberOfHexagonRows - 1) * (6 * hexagonQuarterHeight + 2 * hexagonPadding);
}

function generateHexagonPoints(halfWidth: number, quarterHeight: number) {
    return '' + 1 * halfWidth + ' ' + 0 * quarterHeight +
        ', ' + 2 * halfWidth + ' ' + 1 * quarterHeight +
        ', ' + 2 * halfWidth + ' ' + 3 * quarterHeight +
        ', ' + 1 * halfWidth + ' ' + 4 * quarterHeight +
        ', ' + 0 * halfWidth + ' ' + 3 * quarterHeight +
        ', ' + 0 * halfWidth + ' ' + 1 * quarterHeight;
}


export function FastTrackProgress({doc, search}: {doc: IsaacFastTrackQuestionPageDTO; search: string}) {
    const {questionHistory: qhs}: {questionHistory?: string} = queryString.parse(search);
    const questionHistory = qhs ? qhs.split(",") : [];
    const dispatch = useDispatch();
    const gameboardMaybeNull = useSelector(selectors.board.currentGameboard);
    const fasttrackConcepts = useSelector((appState: AppState) => appState && appState.fasttrackConcepts);

    const deviceSize = useDeviceSize();
    const hexagonUnitLength = {xl: 28, lg: 26, md: 22, sm: 22, xs: 12.5}[deviceSize];
    const hexagonPadding = {xl: 4, lg: 4, md: 3, sm: 3, xs: 2}[deviceSize];
    const hexagonHalfWidth = hexagonUnitLength;
    const hexagonQuarterHeight = hexagonUnitLength / Math.sqrt(3);
    const progressBarPadding = ["xs"].includes(deviceSize) ? 1 : 5;

    const conceptQuestions =
        gameboardMaybeNull && fasttrackConcepts && fasttrackConcepts.gameboardId === gameboardMaybeNull.id && fasttrackConcepts.concept === doc.title ?
            fasttrackConcepts.items
            : null;

    useEffect(() => {
        if (conceptQuestions === null && gameboardMaybeNull) {
            const uppers = questionHistory.filter(e => /upper/i.test(e));
            const upper = uppers.pop() || "";
            dispatch(fetchFasttrackConcepts(gameboardMaybeNull.id as string, doc.title as string, upper));
        }
    }, [dispatch, gameboardMaybeNull, doc, conceptQuestions]);

    if (gameboardMaybeNull === null && conceptQuestions === null) return null;

    // @ts-ignore Assert the properties we use and we know the API returns
    const gameboard: GameboardDTO & { id: string; title: string; questions: GameboardItem[] } = gameboardMaybeNull;

    function getCurrentlyWorkingOn(): AugmentedQuestion {
        return {
            hexagonTitle: "", href: "", isCompleted: false, isCurrentQuestion: false,
            id: doc.id as string,
            title: doc.title as string,
            fastTrackLevel: getFastTrackLevel(doc.tags),
            isConcept: getFastTrackLevel(doc.tags) != 'ft_top_ten'
        };
    }

    const currentlyWorkingOn = getCurrentlyWorkingOn();
    if (currentlyWorkingOn.fastTrackLevel === undefined) {
        return null;
    }

    const progressBarHeight = calculateProgressBarHeight(currentlyWorkingOn.fastTrackLevel, hexagonQuarterHeight, hexagonPadding, progressBarPadding);

    const hexagon = {
        padding: hexagonPadding,
        halfWidth: hexagonHalfWidth,
        quarterHeight: hexagonQuarterHeight,
        x: {
            left: (Math.sqrt(3) * hexagonQuarterHeight) / 2,
            center: hexagonHalfWidth,
            right: (hexagonHalfWidth * 2) - (Math.sqrt(3) * hexagonQuarterHeight) / 2,
        },
        y: {
            top: hexagonQuarterHeight / 2,
            center: 2 * hexagonQuarterHeight,
            bottom: 7 * hexagonQuarterHeight / 2,
        },
        base: {
            stroke: {
                width: {xl: 3, lg: 3, md: 2, sm: 2, xs: 2}[deviceSize],
                colour: '#ddd'
            },
            fill: {
                selectedColour: 'none',
                deselectedColour: '#f0f0f0',
                completedColour: 'none',
                deselectedCompletedColour: '#f0f0f0',
            },
        },
        questionPartProgress: {
            stroke: {
                width: {xl: 3, lg: 3, md: 2, sm: 2, xs: 2}[deviceSize],
                colour: '#009acd'
            },
            fill: {colour: 'none'},
        },
    };

    const conceptConnection = {
        fill: 'none',
        stroke: {
            colour: '#fea100',
            width: {xl: 3, lg: 3, md: 2, sm: 2, xs: 2}[deviceSize],
            dashArray: 4
        },
    };

    function augmentQuestion(question: GameboardItem, gameboardId: string, questionHistory: string[], index: number): AugmentedQuestion {
        const fastTrackLevel = getFastTrackLevel(question.tags);
        let href = "/questions/" + question.id + '?board=' + gameboardId;
        if (questionHistory) {
            let newQuestionHistory = null;
            if (fastTrackLevel == 'ft_top_ten') {
                // Do nothing
            } else if (fastTrackLevel === currentlyWorkingOn.fastTrackLevel) {
                // Maintain history if moving to another question on the same level
                newQuestionHistory = questionHistory;
            } else {
                // Step back in question history if possible
                newQuestionHistory = questionHistory.slice(0, questionHistory.lastIndexOf(question.id as string));
            }
            if (newQuestionHistory && newQuestionHistory.length) {
                href += "&questionHistory=" + newQuestionHistory.join(',');
            }
        }
        return {
            isConcept: false,
            fastTrackLevel,
            isCurrentQuestion: question.id == currentlyWorkingOn.id,
            isCompleted: question.state === 'PERFECT',
            hexagonTitle: "" + (index + 1),
            href,
            id: question.id as string,
            title: question.title as string,
            questionPartStates: question.questionPartStates
        };
    }

    function getMostRecentQuestion(questionHistory: string[], conceptLevel: LevelTag) {
        const reversedQuestionHistory = questionHistory.slice().reverse();
        const questionLevelMatcheFunctions = {
            "ft_top_ten": (questionId: string) => questionId.indexOf('fasttrack') != -1,
            "ft_upper": (questionId: string) => questionId.indexOf('upper') != -1,
            "ft_lower": () => false,
        };
        let result = null;
        for (let questionId of reversedQuestionHistory) {
            if (questionLevelMatcheFunctions[conceptLevel](questionId)) {
                result = questionId;
            }
        }
        return result;
    }

    function orderConceptQuestionsById(unorderedConceptQuestions: ConceptLevelQuestions) {
        let result: ConceptLevelQuestions = {upperLevelQuestions: [], lowerLevelQuestions: []};
        for (let conceptLevelName of conceptLevels) {
            result[conceptLevelName] = unorderedConceptQuestions[conceptLevelName].slice().sort((a: { id?: string }, b: { id?: string }) => a.id === b.id ? 0 : (a.id === undefined || (b.id !== undefined && a.id > b.id)) ? 1 : -1);
        }
        return result;
    }

    interface Connection {
        sourceIndex: number;
        targetIndex: number;
        isMostRecent: boolean;
        message: string;
    }

    interface Progress {
        title: string;
        conceptTitle: string;
        questions: {[key in QuestionLevel]: AugmentedQuestion[]};
        connections: {
            topTenToUpper: Connection[];
            upperToLower: Connection[];
        };
    }

    function evaluateProgress(unorderedConceptQuestions: ConceptLevelQuestions, questionHistory: string[]): Progress {
        const progress: Progress = {title: '', conceptTitle: '', questions: {topTen: [], upper: [], lower: []}, connections: {topTenToUpper: [], upperToLower: []}};

        // Store title information for local storage retrieval
        progress.title = gameboard.title;
        progress.conceptTitle = currentlyWorkingOn.isConcept ? currentlyWorkingOn.title : '';

        const conceptQuestions = orderConceptQuestionsById(unorderedConceptQuestions);

        // Evaluate top ten progress
        for (let i = 0; i < gameboard.questions.length; i++) {
            const question = gameboard.questions[i];
            progress.questions.topTen.push(augmentQuestion(question, gameboard.id, questionHistory, i));
        }

        // Evalueate concept question progress
        if (currentlyWorkingOn.isConcept) {
            let upperAndLowerConceptQuestions: Map<QuestionLevel, GameboardItem[]> = new Map([['upper', conceptQuestions.upperLevelQuestions], ['lower', conceptQuestions.lowerLevelQuestions]]);
            upperAndLowerConceptQuestions.forEach((conceptQuestionsOfType, conceptQuestionType) => {
                for (let i = 0; i < conceptQuestionsOfType.length; i++) {
                    let question = conceptQuestionsOfType[i];
                    progress.questions[conceptQuestionType].push(augmentQuestion(question, gameboard.id, questionHistory, i))
                }
            });
        }

        // Evaluate concept connections
        if (currentlyWorkingOn.isConcept) {
            let mostRecentTopTenQuestionId = getMostRecentQuestion(questionHistory, 'ft_top_ten') || undefined;
            let mostRecenetTopTenIndex = gameboard.questions.map((question: GameboardItem) => question.id).indexOf(mostRecentTopTenQuestionId);

            let upperQuestionId = currentlyWorkingOn.fastTrackLevel === 'ft_upper' ? currentlyWorkingOn.id : getMostRecentQuestion(questionHistory, 'ft_upper');
            let upperIndex = conceptQuestions.upperLevelQuestions.map(question => question.id).indexOf(upperQuestionId as string);

            // Top Ten to Upper connection
            progress.connections.topTenToUpper.push({
                sourceIndex: mostRecenetTopTenIndex,
                targetIndex: upperIndex,
                isMostRecent: true,
                message: "Practise the concept before returning to complete the board"
            });

            // Upper to Lower connections
            if (currentlyWorkingOn.fastTrackLevel === 'ft_lower') {
                let lowerIndex = conceptQuestions.lowerLevelQuestions.map(question => question.id).indexOf(currentlyWorkingOn.id);
                progress.connections.upperToLower.push({
                    sourceIndex: upperIndex,
                    targetIndex: lowerIndex,
                    isMostRecent: true,
                    message: "Practise the concept with easier quesitons before returning to complete the board"
                });
            }
        }
        return progress;
    }

    function generateHexagon<T>(states: T[] | undefined, selector: (t: T) => boolean, properties: { stroke: { colour: string; width: number } }, fillColour: string, clickable: boolean) {
        let polygonAttributes: { strokeWidth: number; fill: string; stroke: string; points: string; strokeDasharray?: string; pointerEvents?: string } = {
            points: generateHexagonPoints(hexagon.halfWidth, hexagon.quarterHeight),
            stroke: properties.stroke.colour,
            strokeWidth: properties.stroke.width,
            fill: fillColour,
        };
        const perimiter = 6 * 2 * (hexagon.quarterHeight);
        const dashArray = calculateDashArray(states, selector, perimiter);
        if (dashArray) {
            polygonAttributes.strokeDasharray = dashArray;
        }
        if (clickable) {
            polygonAttributes.pointerEvents = 'visible';
        }
        return <polygon {...polygonAttributes} />;
    }

    function generateHexagonTitle(title: string, isCurrentQuestion: boolean) {
        let isTwoCharLength = ("" + title).length > 1;
        let xSingleCharPosition = hexagon.halfWidth - {xl: 8, lg: 8, md: 6, sm: 6, xs: 5}[deviceSize];
        let xTwoCharPosition = hexagon.halfWidth - {xl: 14, lg: 14, md: 11, sm: 11, xs: 10}[deviceSize];
        let yPosition = hexagon.quarterHeight * 2 + {xl: 9, lg: 9, md: 7, sm: 7, xs: 6}[deviceSize];
        return <text
            fontFamily="Exo 2"
            fontSize={{xl: 26, lg: 26, md: 18, sm: 18, xs: 18}[deviceSize]}
            fontStyle="italic"
            fontWeight={["xs"].includes(deviceSize) ? 500 : 600}
            fill={isCurrentQuestion ? '#333' : '#ccc'}
            stroke="none"
            strokeWidth={1}
            strokeLinejoin="round"
            strokeLinecap="round"
            x={isTwoCharLength ? xTwoCharPosition : xSingleCharPosition}
            y={yPosition}
        >{title}</text>;
    }

    function generateCompletionTick(isCurrentQuestion: boolean) {
        return <image
            href="/assets/tick-bg.png"
            height={{xl: 36, lg: 34, md: 29, sm: 29, xs: 18}[deviceSize]}
            width={{xl: 36, lg: 34, md: 29, sm: 29, xs: 18}[deviceSize]}
            x={hexagon.halfWidth - {xl: 18, lg: 17, md: 15, sm: 15, xs: 9}[deviceSize]}
            y={hexagon.quarterHeight - {xl: 2, lg: 2, md: 2, sm: 2, xs: 2}[deviceSize]}
            opacity={isCurrentQuestion ? 1 : 0.3}
        />;
    }

    function calculateConnectionLine(sourceIndex: number, targetIndex: number) {
        let result = '';

        let hexagonWidth = 2 * (hexagon.halfWidth + hexagon.padding);

        let sourceHexagonX = (sourceIndex <= targetIndex ? sourceIndex * hexagonWidth : Math.max(sourceIndex - 1, 0) * hexagonWidth);
        let targetHexagonX = (targetIndex <= sourceIndex ? targetIndex * hexagonWidth : Math.max(targetIndex - 1, 0) * hexagonWidth);

        // First stroke
        if (sourceIndex <= targetIndex) {
            result += moveTo(sourceHexagonX + hexagon.x.left, hexagon.y.top);
        } else {
            result += moveTo(sourceHexagonX + hexagon.x.right, hexagon.y.top);
        }
        result += line(sourceHexagonX + hexagon.x.center, hexagon.y.center);

        // Horizontal connection
        if (Math.abs(sourceIndex - targetIndex) > 1) {
            result += line(targetHexagonX + hexagon.x.center, hexagon.y.center);
        }

        // Last stroke
        if (targetIndex <= sourceIndex) {
            result += line(targetHexagonX + hexagon.x.left, hexagon.y.bottom);
        } else {
            result += line(targetHexagonX + hexagon.x.right, hexagon.y.bottom);
        }

        return result;
    }

    function createQuestionHexagon(question: AugmentedQuestion) {
        const fillColour = (question.isCompleted) ?
            question.isCurrentQuestion ? hexagon.base.fill.completedColour : hexagon.base.fill.deselectedCompletedColour :
            question.isCurrentQuestion ? hexagon.base.fill.selectedColour : hexagon.base.fill.deselectedColour;

        return <Link to={question.href}>
            <title>{question.title + (question.isCurrentQuestion ? ' (Current)' : '')}</title>
            {generateHexagon(
                [true],
                allVisible => allVisible,
                hexagon.base,
                fillColour,
                true)}

            {generateHexagon(
                question.questionPartStates,
                state => state === 'CORRECT',
                hexagon.questionPartProgress,
                'none',
                false)}

            {question.isCompleted ?
                generateCompletionTick(question.isCurrentQuestion) :
                generateHexagonTitle(question.hexagonTitle, question.isCurrentQuestion)}
        </Link>;
    }

    function createConnection(sourceIndex: number, targetIndex: number) {
        return <path
            d={calculateConnectionLine(sourceIndex, targetIndex)}
            fill={conceptConnection.fill}
            stroke={conceptConnection.stroke.colour}
            strokeWidth={conceptConnection.stroke.width}
            strokeDasharray={conceptConnection.stroke.dashArray}
        />;
    }

    function createQuestionRow(questions: AugmentedQuestion[], fastTrackLevel: string, conceptRowIndex: number) {
        return <g key={fastTrackLevel + '-question-hexagons'}
            transform={'translate(0,' + conceptRowIndex * (6 * hexagon.quarterHeight + 2 * hexagon.padding) + ')'}>
            {questions.map((question, columnIndex) => (
                <g key={question.id} className={fastTrackLevel + '-question-hexagon'}
                    transform={'translate(' + columnIndex * 2 * (hexagon.halfWidth + hexagon.padding) + ', 0)'}>
                    {createQuestionHexagon(question)}
                </g>
            ))}
        </g>;
    }

    function createConceptConnectionRow(conceptConnections: Connection[], connectionName: string, connectionRowIndex: number) {
        return <g key={connectionName + '-concept-connections'}
            transform={'translate(' +
                  (hexagon.halfWidth + hexagon.padding) + ',' +
                  (3 * hexagon.quarterHeight + hexagon.padding + connectionRowIndex * (6 * hexagon.quarterHeight + 2 * hexagon.padding)) + ')'}>
            {conceptConnections.map(conceptConnection => (<React.Fragment key={JSON.stringify(conceptConnection)}>
                <title>{conceptConnection.message}</title>
                {createConnection(conceptConnection.sourceIndex, conceptConnection.targetIndex)}
            </React.Fragment>))}
        </g>;
    }

    function renderProgress(progress: Progress) {
        return <RS.Row className="mt-sm-3 mb-3 mb-sm-4">
            <RS.Col cols={12} lg={4}>
                <h4 className="mt-lg-1">{gameboard.title}</h4>
                <div className="d-none d-lg-block">
                    <br className="d-none d-lg-block"/>
                    <br className="d-none d-xl-block"/>
                    {currentlyWorkingOn.isConcept && <h4 className="mt-lg-1 mt-xl-3">{currentlyWorkingOn.title} Practice</h4>}
                </div>
            </RS.Col>
            <RS.Col cols={12} lg={8}>
                <svg id="ft-progress" width="100%" height={progressBarHeight}>
                    <g id="progress-bar-padding" transform={`translate(${progressBarPadding}, ${progressBarPadding})`}>
                        <g id="concept-connections">
                            {progress.connections.topTenToUpper.length &&
                                createConceptConnectionRow(progress.connections.topTenToUpper, 'top-ten-to-upper', 0)}
                            {progress.connections.upperToLower.length &&
                                createConceptConnectionRow(progress.connections.upperToLower, 'upper-to-lower', 1)}
                        </g>
                        <g id="question-hexagons">
                            {createQuestionRow(progress.questions.topTen, 'top_ten', 0)}
                            {progress.questions.upper.length &&
                                createQuestionRow(progress.questions.upper, 'upper', 1)}
                            {progress.questions.lower.length &&
                                createQuestionRow(progress.questions.lower, 'lower', 2)}
                        </g>
                    </g>
                </svg>
            </RS.Col>
            <RS.Col cols={12} className="d-block d-lg-none">
                <div>
                    {currentlyWorkingOn.isConcept && <h4 className="mt-2">{currentlyWorkingOn.title} Practice</h4>}
                </div>
            </RS.Col>
        </RS.Row>;
    }

    const categorisedConceptQuestions = categoriseConceptQuestions(conceptQuestions || []);
    const progress = evaluateProgress(categorisedConceptQuestions, questionHistory);
    return renderProgress(progress);
}
