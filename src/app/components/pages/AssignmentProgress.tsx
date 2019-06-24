import React, {ComponentProps, useEffect, useLayoutEffect, useRef, useState} from "react";
import {connect} from "react-redux";
import {
    Container,
    Row,
    Col,
    UncontrolledButtonDropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Label, Spinner, Button
} from "reactstrap"
import {
    loadGroups,
    loadAssignmentsOwnedByMe,
    loadBoard,
    loadProgress,
    openActiveModal
} from "../../state/actions";
import {ShowLoading} from "../handlers/ShowLoading";
import {AppState} from "../../state/reducers";
import {sortBy, orderBy} from "lodash";
import {AppGroup, AppAssignmentProgress, ActiveModal} from "../../../IsaacAppTypes";
import {groups} from "../../state/selectors";
import {TitleAndBreadcrumb} from "../elements/TitleAndBreadcrumb";
import {AssignmentDTO, GameboardDTO, GameboardItem, GameboardItemState} from "../../../IsaacApiTypes";
import {Link} from "react-router-dom";
import {API_PATH} from "../../services/constants";
import {downloadLinkModal} from "../elements/AssignmentProgressModalCreators";

const stateFromProps = (state: AppState) => {
    if (state != null) {
        const gameboards: { [id: string]: GameboardDTO} = {};
        if (state.boards && state.boards.boards) {
            state.boards.boards.boards.forEach(board => {
                gameboards[board.id as string] = board;
            });
        }

        const progress = state.progress;
        const assignments: { [id: number]: EnhancedAssignment[] } = {};
        if (state.assignmentsByMe) {
            state.assignmentsByMe.forEach(a => {
                const assignment = a as EnhancedAssignment;
                const id = assignment.groupId as number;
                assignment.gameboard = assignment.gameboard || gameboards[assignment.gameboardId as string];
                assignment.progress = progress && progress[assignment._id as number] || undefined;
                if (id in assignments) {
                    assignments[id].push(assignment);
                } else {
                    assignments[id] = [assignment];
                }
            });
        }

        const activeGroups = groups.active(state);
        if (activeGroups) {
            const activeGroupsWithAssignments = activeGroups.map(g => {
                const gWithAssignments = g as AppGroupWithAssignments;
                gWithAssignments.assignments = assignments[g.id as number] || [];
                return gWithAssignments;
            });
            return {
                groups: activeGroupsWithAssignments
            };
        }
    }
    return {
        groups: null
    };
};

const dispatchFromProps = {loadGroups, loadAssignmentsOwnedByMe, loadBoard, loadProgress, openActiveModal};


type EnhancedAssignment = AssignmentDTO & {
    gameboard: GameboardDTO & {questions: (GameboardItem & {questionPartsTotal: number})[]};
    _id: number;
    progress?: AppAssignmentProgress[];
};

type AppGroupWithAssignments = AppGroup & {assignments: EnhancedAssignment[]};

interface AssignmentProgressPageProps {
    groups: AppGroupWithAssignments[] | null;
    loadGroups: (getArchived: boolean) => void;
    loadAssignmentsOwnedByMe: () => void;
    loadBoard: (boardId: string) => void;
    loadProgress: (assignment: AssignmentDTO) => void;
    openActiveModal: (modal: ActiveModal) => void;
}

enum SortOrder {
    "Alphabetical" = "Alphabetical",
    "Date Created" = "Date Created"
}

interface PageSettings {
    colourBlind: boolean;
    setColourBlind: (newValue: boolean) => void;
    formatAsPercentage: boolean;
    setFormatAsPercentage: (newValue: boolean) => void;
}

type GroupDetailsProps = AssignmentProgressPageProps & {
    group: AppGroupWithAssignments;
    pageSettings: PageSettings;
};

type AssignmentDetailsProps = GroupDetailsProps & {
    assignment: EnhancedAssignment; // We only show this when we have the gameboard loaded.
};

type ProgressDetailsProps = AssignmentDetailsProps & {
    progress: AppAssignmentProgress[];
};

const passMark = 0.75;

function formatDate(date: number | Date | undefined) {
    if (!date) return "Unknown";
    const dateObject = new Date(date);
    return dateObject.toLocaleDateString();
}

function formatMark(numerator: number, denominator: number, formatAsPercentage: boolean) {
    let result;
    if (formatAsPercentage) {
        result = denominator !== 0 ? Math.round(100 * numerator / denominator) + "%" : "100%";
    } else {
        result = numerator + "/" + denominator;
    }
    return result;
}

const ProgressDetails = (props: ProgressDetailsProps) => {
    const {assignment, progress, pageSettings} = props;

    const [selectedQuestionNumber, setSelectedQuestion] = useState(0);
    const selectedQuestion = assignment.gameboard.questions[selectedQuestionNumber];

    type SortOrder = number | "name" | "totalQuestionPartPercentage" | "totalQuestionPercentage";
    const [sortOrder, setSortOrder] = useState<SortOrder>("name");
    const [reverseOrder, setReverseOrder] = useState(false);

    // TODO: useMemo on this stuff if performance is a problem

    // Calculate 'class average', which isn't an average at all, it's the percentage of ticks per question.
    let questions = assignment.gameboard.questions;
    const assignmentAverages: number[] = [];
    let assignmentTotalQuestionParts = 0;

    for (let i in questions) {
        let q = questions[i];
        let tickCount = 0;

        for (let j = 0; j < progress.length; j++) {
            let studentResults = progress[j].results;

            if (studentResults[i] == "PASSED" || studentResults[i] == "PERFECT") {
                tickCount++;
            }
        }

        let tickPercent = Math.round(100 * (tickCount / progress.length));
        assignmentAverages.push(tickPercent);
        assignmentTotalQuestionParts += q.questionPartsTotal;
    }

    // Calculate student totals and gameboard totals
    let studentsCorrect = 0;
    for (let j = 0; j < progress.length; j++) {

        let studentProgress = progress[j];

        if (progress[j].user.authorisedFullAccess) {

            studentProgress.tickCount = 0;
            studentProgress.correctQuestionPartsCount = 0;
            studentProgress.incorrectQuestionPartsCount = 0;
            studentProgress.notAttemptedPartResults = [];

            for (let i in studentProgress.results) {
                if (studentProgress.results[i] == "PASSED" || studentProgress.results[i] == "PERFECT") {
                    studentProgress.tickCount++;
                }
                studentProgress.correctQuestionPartsCount += studentProgress.correctPartResults[i];
                studentProgress.incorrectQuestionPartsCount += studentProgress.incorrectPartResults[i];
                studentProgress.notAttemptedPartResults.push(questions[i].questionPartsTotal - studentProgress.correctPartResults[i] - studentProgress.incorrectPartResults[i]);
            }

            if (studentProgress.tickCount == questions.length) {
                studentsCorrect++;
            }

        }
    }

    const sortedProgress = orderBy(progress, (item) => {
        switch (sortOrder) {
            case "name":
                return item.user.familyName + ", " + item.user.givenName;
            case "totalQuestionPartPercentage":
                return -item.correctQuestionPartsCount;
            case "totalQuestionPercentage":
                return -item.tickCount;
            default:
                return -item.correctPartResults[sortOrder];
        }
    }, [reverseOrder ? "desc" : "asc"]);

    function isSelected(q: GameboardItem) {
        return q == selectedQuestion ? "selected" : "";
    }

    function sortClasses(q: SortOrder) {
        if (q == sortOrder) {
            return "sorted" + (reverseOrder ? " reverse" : " forward");
        } else {
            return "";
        }
    }

    function sortItem(props: ComponentProps<"th"> & {itemOrder: SortOrder}) {
        const {itemOrder, ...rest} = props;
        const className = (props.className || "") + " " + sortClasses(itemOrder);
        const clickToSelect = typeof itemOrder === "number" ? (() => setSelectedQuestion(itemOrder)) : undefined;
        const sortArrows = (typeof itemOrder !== "number" || itemOrder == selectedQuestionNumber) ?
            <React.Fragment>
                <button className="up" onClick={() => {setSortOrder(itemOrder); setReverseOrder(false);}}>▲</button>
                <button className="down" onClick={() => {setSortOrder(itemOrder); setReverseOrder(true);}}>▼</button>
            </React.Fragment>
            : undefined;
        return <th key={props.key} {...rest} className={className} onClick={clickToSelect}>{props.children}{sortArrows}</th>;
    }

    const tableHeaderFooter = <tr className="progress-table-header-footer">
        {sortItem({key: "name", itemOrder: "name"})}
        {questions.map((q, index) =>
            sortItem({key: q.id, itemOrder: index, className: isSelected(q), children: `${assignmentAverages[index]}%`})
        )}
        {sortItem({key: "totalQuestionPartPercentage", itemOrder: "totalQuestionPartPercentage", className:"total-column left", children: "Total Parts"})}
        {sortItem({key: "totalQuestionPercentage", itemOrder: "totalQuestionPercentage", className:"total-column right", children: "Total Qs"})}
    </tr>;

    function markClassesInternal(studentProgress: AppAssignmentProgress, status: GameboardItemState | null, correctParts: number, incorrectParts: number, totalParts: number) {
        if (!studentProgress.user.authorisedFullAccess) {
            return "revoked";
        } else if (correctParts == totalParts) {
            return "completed";
        } else if (status == "PASSED" || (correctParts / totalParts) >= passMark) {
            return "passed";
        } else if (status == "FAILED" || (incorrectParts / totalParts) > (1 - passMark)) {
            return "failed";
        } else if (correctParts > 0 || incorrectParts > 0) {
            return "in-progress";
        } else {
            return "not-attempted";
        }
    }

    function markClasses(studentProgress: AppAssignmentProgress, totalParts: number) {
        let correctParts = studentProgress.correctQuestionPartsCount;
        let incorrectParts = studentProgress.incorrectQuestionPartsCount;
        let status = null;

        return markClassesInternal(studentProgress, status, correctParts, incorrectParts, totalParts);
    }

    function markQuestionClasses(studentProgress: AppAssignmentProgress, index: number) {
        const question = questions[index];

        const totalParts = question.questionPartsTotal;
        let correctParts = studentProgress.correctPartResults[index];
        let incorrectParts = studentProgress.incorrectPartResults[index];
        let status = studentProgress.results[index];

        return isSelected(question) + " " + markClassesInternal(studentProgress, status, correctParts, incorrectParts, totalParts);
    }

    const tableRef = useRef<HTMLTableElement>(null);

    useLayoutEffect(() => {
        const table = tableRef.current;
        if (table) {
            const parentElement = table.parentElement as HTMLElement;
            const firstRow = (table.firstChild as HTMLTableSectionElement).firstChild as HTMLTableRowElement;
            const questionTH = firstRow.children[selectedQuestionNumber + 1] as HTMLTableHeaderCellElement;

            const offsetLeft = questionTH.offsetLeft;
            const parentScrollLeft = parentElement.scrollLeft;
            const parentLeft = parentScrollLeft + parentElement.offsetLeft + 130;
            const width = questionTH.offsetWidth;

            let newScrollLeft;

            if (offsetLeft < parentLeft) {
                newScrollLeft = parentScrollLeft + offsetLeft - parentLeft - width / 2;
            } else {
                const offsetRight = offsetLeft + width;
                const parentRight = parentLeft + parentElement.offsetWidth - 260;
                if (offsetRight > parentRight) {
                    newScrollLeft = parentScrollLeft + offsetRight - parentRight + width / 2;
                }
            }
            if (newScrollLeft != undefined) {
                parentElement.scrollLeft = newScrollLeft;
            }
        }
    }, [selectedQuestionNumber]);

    return <div className="assignment-progress-progress">
        <div className="progress-header">
            <strong>{studentsCorrect}</strong> of <strong>{progress.length}</strong> students have completed the gameboard <Link to={`/gameboards#${assignment.gameboardId}`}>{assignment.gameboard.title}</Link> correctly.
        </div>
        {progress.length > 0 && <React.Fragment>
            <div className="progress-questions">
                <Button color="tertiary" disabled={selectedQuestionNumber == 0}
                    onClick={() => setSelectedQuestion(selectedQuestionNumber - 1)}>◄</Button>
                <div><Link
                    to={`/questions/${selectedQuestion.id}?board=${assignment.gameboardId}`}><strong>Question: </strong>{selectedQuestion.title}
                </Link></div>
                <Button color="tertiary" disabled={selectedQuestionNumber == assignment.gameboard.questions.length - 1}
                    onClick={() => setSelectedQuestion(selectedQuestionNumber + 1)}>►</Button>
            </div>
            <div className="progress-table">
                <table ref={tableRef}>
                    <thead>
                        {tableHeaderFooter}
                    </thead>
                    <tbody>
                        {sortedProgress.map((studentProgress) => {
                            const fullAccess = studentProgress.user.authorisedFullAccess;
                            return <tr key={studentProgress.user.id} className={`${markClasses(studentProgress, assignmentTotalQuestionParts)}${fullAccess ? "" : " revoked"}`} title={`${studentProgress.user.givenName + " " + studentProgress.user.familyName}`}>
                                <th className="student-name">{studentProgress.user.givenName}<span
                                    className="d-none d-lg-inline"> {studentProgress.user.familyName}</span></th>
                                {questions.map((q, index) =>
                                    <td key={q.id} className={markQuestionClasses(studentProgress, index)} onClick={() => setSelectedQuestion(index)}>
                                        {fullAccess ? formatMark(studentProgress.correctPartResults[index],
                                            questions[index].questionPartsTotal,
                                            pageSettings.formatAsPercentage) : ""}
                                    </td>
                                )}
                                <th className="total-column left" title={fullAccess ? undefined : "Not Sharing"}>
                                    {fullAccess ? formatMark(studentProgress.correctQuestionPartsCount,
                                        assignmentTotalQuestionParts,
                                        pageSettings.formatAsPercentage) : ""}
                                </th>
                                <th className="total-column right" title={fullAccess ? undefined : "Not Sharing"}>
                                    {fullAccess ? formatMark(studentProgress.tickCount,
                                        questions.length,
                                        pageSettings.formatAsPercentage) : ""}
                                </th>
                            </tr>;
                        })}
                    </tbody>
                    <tfoot>
                        {tableHeaderFooter}
                    </tfoot>
                </table>
            </div>
        </React.Fragment>}
    </div>;
};

const ProgressLoader = (props: AssignmentDetailsProps) => {
    const {assignment, loadProgress} = props;

    useEffect( () => {
        loadProgress(assignment);
    }, [assignment._id]);

    const progress = assignment.progress;

    return progress ? <ProgressDetails {...props} progress={progress} />
        : <div className="p-4 text-center"><Spinner color="primary" size="lg" /></div>;
};

function getCSVDownloadLink(assignmentId: number) {
    return API_PATH + "/assignments/assign/" + assignmentId + "/progress/download";
}

const AssignmentDetails = (props: AssignmentDetailsProps) => {
    const {assignment, openActiveModal} = props;

    const [isExpanded, setIsExpanded] = useState(false);

    function openAssignmentDownloadLink(event: React.MouseEvent<HTMLAnchorElement>) {
        event.stopPropagation();
        event.preventDefault();
        openActiveModal(downloadLinkModal(event.currentTarget.href));
    }

    return <div className="assignment-progress-gameboard" key={assignment.gameboardId}>
        <div className="gameboard-header" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="gameboard-title">
                <span>{assignment.gameboard.title}{assignment.dueDate && <span className="gameboard-due-date">(Due:&nbsp;{formatDate(assignment.dueDate)})</span>}</span>
            </div>
            <div className="gameboard-links">
                <Button color="link">{isExpanded ? "Hide " : "View "} <span className="d-none d-md-inline">mark sheet</span></Button>
                <span>or</span>
                <Button color="link" tag="a" href={getCSVDownloadLink(assignment._id)} onClick={openAssignmentDownloadLink}>Download CSV</Button>
            </div>
        </div>
        {isExpanded && <ProgressLoader {...props} />}
    </div>
};

function hasGameboard(assignment: AssignmentDTO): assignment is EnhancedAssignment {
    return assignment.gameboard != undefined;
}

const GroupDetails = (props: GroupDetailsProps) => {
    const {group, pageSettings, loadBoard} = props;

    const gameboardIs = group.assignments.map(assignment => assignment.gameboardId as string);
    const joinedGameboardIds = gameboardIs.join(",");
    useEffect( () => {
        gameboardIs.forEach(gameboardId => loadBoard(gameboardId));
    }, [joinedGameboardIds]);

    const gameboardsLoaded = group.assignments.every(assignment => assignment.gameboard != null);

    return <div className={"assignment-progress-details" + (pageSettings.colourBlind ? " colour-blind" : "")}>
        <div className="p-4"><div className="assignment-progress-legend">
            <ul className="block-grid-xs-5">
                <li>
                    <div className="key-cell"><span className="completed">&nbsp;</span>
                    </div>
                    <div className="key-description">100% correct</div>
                </li>
                <li>
                    <div className="key-cell"><span className="passed">&nbsp;</span>
                    </div>
                    <div className="key-description">&ge;{passMark * 100}% correct
                        <span className="d-none d-md-inline"> (or Mastery)</span></div>
                </li>
                <li>
                    <div className="key-cell"><span className="in-progress">&nbsp;</span>
                    </div>
                    <div className="key-description">&lt;{passMark * 100}% correct</div>
                </li>
                <li>
                    <div className="key-cell"><span>&nbsp;</span>
                    </div>
                    <div className="key-description"><span className="d-none d-md-inline">Not attempted</span><span
                        className="d-inline d-md-none">No attempt</span></div>
                </li>
                <li>
                    <div className="key-cell"><span className="failed">&nbsp;</span>
                    </div>
                    <div className="key-description">&gt;{100 -(passMark * 100)}% incorrect</div>
                </li>
            </ul>
            <div className="assignment-progress-options">
                <label>Colour-blind&nbsp;<input type="checkbox" checked={pageSettings.colourBlind} onChange={e => pageSettings.setColourBlind(e.target.checked)}/></label>
                <label>Percent view&nbsp;<input type="checkbox" checked={pageSettings.formatAsPercentage} onChange={e => pageSettings.setFormatAsPercentage(e.target.checked)}/></label>
            </div>
        </div></div>
        {gameboardsLoaded ? group.assignments.map(assignment => hasGameboard(assignment) && <AssignmentDetails key={assignment.gameboardId} {...props} assignment={assignment}/>)
            : <div className="p-4 text-center"><Spinner color="primary" size="lg" /></div>}
    </div>;
};

function getGroupProgressCSVDownloadLink(groupId: number) {
    return API_PATH + "/assignments/assign/group/" + groupId + "/progress/download";
}

const GroupAssignmentProgress = (props: GroupDetailsProps) => {
    const {group, openActiveModal} = props;
    const [isExpanded, setExpanded] = useState(false);

    const assignmentCount = group.assignments.length;

    function openGroupDownloadLink(event: React.MouseEvent<HTMLAnchorElement>) {
        event.stopPropagation();
        event.preventDefault();
        //showDownloadModal(event.currentTarget.href);
        openActiveModal(downloadLinkModal(event.currentTarget.href));
    }

    return <React.Fragment>
        <Row onClick={() => setExpanded(!isExpanded)} className={isExpanded ? "assignment-progress-group active" : "assignment-progress-group"}>
            <Col className="group-name"><span className="icon-group"/><span>{group.groupName}</span></Col>
            <Col className="flex-grow-1" />
            <Col><strong>{assignmentCount}</strong> Assignment{assignmentCount != 1 && "s"} set</Col>
            <Col className="d-none d-md-block"><a href={getGroupProgressCSVDownloadLink(group.id as number)} target="_blank" onClick={openGroupDownloadLink}>(Download Group CSV)</a></Col>
            <Col><img src="/assets/icon-expand-arrow.png" alt="" className="accordion-arrow" /></Col>
        </Row>
        {isExpanded && <GroupDetails {...props} />}
    </React.Fragment>;
};

const AssignmentProgressPageComponent = (props: AssignmentProgressPageProps) => {
    const {groups, loadGroups, loadAssignmentsOwnedByMe} = props;

    const [colourBlind, setColourBlind] = useState(false);
    const [formatAsPercentage, setFormatAsPercentage] = useState(false);

    const pageSettings = {colourBlind, setColourBlind, formatAsPercentage, setFormatAsPercentage};

    const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.Alphabetical);

    let data = groups;
    if (data) {
        switch(sortOrder) {
            case SortOrder.Alphabetical:
                data = sortBy(data, g => g.groupName && g.groupName.toLowerCase());
                break;
            case SortOrder["Date Created"]:
                data = sortBy(data, g => g.created).reverse();
                break;
        }
    }

    useEffect(() => {
        loadGroups(false);
        loadAssignmentsOwnedByMe();
    }, []);

    return <React.Fragment>
        <Container>
            <TitleAndBreadcrumb currentPageTitle="Assignment Progress" subTitle="Track your class performance" intermediateCrumbs={[{title: "Teachers", to: "#"}]} help="Click on your groups to see the assignments you have set. View your students' progress by question." />
            <Row className="align-items-center d-none d-md-flex">
                <Col className="text-right">
                    <Label className="pr-2">Sort groups:</Label>
                    <UncontrolledButtonDropdown size="sm">
                        <DropdownToggle color="tertiary" caret>
                            {sortOrder}
                        </DropdownToggle>
                        <DropdownMenu>
                            {Object.values(SortOrder).map(item =>
                                <DropdownItem key={item} onClick={() => setSortOrder(item)}>{item}</DropdownItem>
                            )}
                        </DropdownMenu>
                    </UncontrolledButtonDropdown>
                </Col>
            </Row>
        </Container>
        <div className="assignment-progress-container">
            <ShowLoading until={data}>
                {data && data.map(group => <GroupAssignmentProgress key={group.id} {...props} group={group} pageSettings={pageSettings} />)}
                {data && data.length == 0 && <h3>You&apos;ll need to create a group using <Link to="/groups">Manage Groups</Link> to set an assignment.</h3>}
            </ShowLoading>
        </div>
    </React.Fragment>;
};

export const AssignmentProgress = connect(stateFromProps, dispatchFromProps)(AssignmentProgressPageComponent);