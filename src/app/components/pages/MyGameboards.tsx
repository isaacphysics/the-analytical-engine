import React, {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {deleteBoard, loadBoards} from "../../state/actions";
import {ShowLoading} from "../handlers/ShowLoading";
import {AppState, Boards} from "../../state/reducers";
import {
    Button,
    Card,
    CardBody,
    CardSubtitle,
    CardTitle,
    Col,
    Container,
    CustomInput,
    Input,
    Label,
    Row,
    Spinner,
    Table
} from 'reactstrap';
import {ActualBoardLimit, AppGameBoard, BoardOrder} from "../../../IsaacAppTypes";
import {RegisteredUserDTO} from "../../../IsaacApiTypes";
import {boards as ThisBoards} from "../../state/selectors";
import {TitleAndBreadcrumb} from "../elements/TitleAndBreadcrumb";
import {sortIcon} from "../../services/constants";
import {
    boardCompletionSelection,
    boardLevelsSelection,
    determineGameboardLevels,
    determineGameboardSubjects,
    formatBoardOwner,
    generateGameboardSubjectHexagons
} from "../../services/gameboards";
import {isMobile} from "../../services/device";
import {formatDate} from "../elements/DateString";
import {ShareLink} from "../elements/ShareLink";
import {Link} from "react-router-dom";
import {SITE, SITE_SUBJECT} from "../../services/siteConstants";
import Select from "react-select";
import {multiSelectOnChange} from "../../services/gameboardBuilder";

interface MyBoardsPageProps {
    user: RegisteredUserDTO;
    boards: Boards | null;
}

enum boardCreators {
    "all" = "All",
    "isaac" = "Isaac",
    "me" = "Me",
    "someoneelse" = "Someone else"
}
enum boardCompletions {
    "any" = "Any",
    "notStarted" = "Not Started",
    "inProgress" = "In Progress",
    "completed" = "Completed"
}
enum BoardLimit {
    "six" = "6",
    "eighteen" = "18",
    "sixy" = "60",
    "All" = "ALL"
}
enum boardViews {
    "table" = "Table View",
    "card" = "Card View"
}
const orderNames: {[key in BoardOrder]: string} = {
    "created": "Date Created Ascending",
    "-created": "Date Created Descending",
    "visited": "Date Visited Ascending",
    "-visited": "Date Visited Descending",
    "title": "Title Ascending",
    "-title": "Title Descending"
};

type BoardTableProps = MyBoardsPageProps & {
    board: AppGameBoard;
    setSelectedBoards: (e: any) => void;
    selectedBoards: AppGameBoard[];
    boardView: boardViews;
}

const Board = (props: BoardTableProps) => {
    const {user, board, setSelectedBoards, selectedBoards, boardView} = props;

    const boardLink = `/gameboards#${board.id}`;

    const dispatch = useDispatch();

    const updateBoardSelection = (board: AppGameBoard, checked: boolean) => {
        if (checked) {
            setSelectedBoards([...selectedBoards, board]);
        } else {
            setSelectedBoards(selectedBoards.filter((thisBoard) => thisBoard.id !== board.id));
        }
    };

    function confirmCardDeleteBoard() {
        if (confirm(`Are you sure you want to remove '${board.title}' from your account?`)) {
            dispatch(deleteBoard(board));
        }
    }

    const boardSubjects = determineGameboardSubjects(board);

    return boardView == boardViews.table ?
        <tr key={board.id} className="board-card">
            <td>
                <div className="board-subject-hexagon-container table-view">
                    {(board.percentageCompleted == 100) ? <span className="board-subject-hexagon subject-complete"/> :
                        <>
                            {generateGameboardSubjectHexagons(boardSubjects)}
                            <div className="board-percent-completed">{board.percentageCompleted}</div>
                        </>
                    }
                </div>
            </td>
            <td className="align-middle"><a href={boardLink}>{board.title}</a></td>
            {SITE_SUBJECT == SITE.PHY && <td className="text-center align-middle">{determineGameboardLevels(board).join(' ')}</td>}
            <td className="text-center align-middle">{formatBoardOwner(user, board)}</td>
            <td className="text-center align-middle">{formatDate(board.creationDate)}</td>
            <td className="text-center align-middle">{formatDate(board.lastVisited)}</td>
            <td className="text-center align-middle">
                <div className="table-share-link"><ShareLink linkUrl={boardLink} reducedWidthLink /></div>
            </td>
            <td><CustomInput id={`board-delete-${board.id}`} type="checkbox" checked={board && (selectedBoards.some(e => e.id === board.id))}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    board && updateBoardSelection(board, event.target.checked)
                }} aria-label="Delete gameboard"/></td>
        </tr>
        :
        <Card className="board-card card-neat">
            <CardBody className="pb-4 pt-4">
                <button className="close" onClick={confirmCardDeleteBoard} aria-label="Delete gameboard">×</button>
                <div className="board-subject-hexagon-container">
                    {(board.percentageCompleted == 100) ? <span className="board-subject-hexagon subject-complete"/> :
                        <>
                            {generateGameboardSubjectHexagons(boardSubjects)}
                            <div className="board-percent-completed">{board.percentageCompleted}</div>
                        </>
                    }
                </div>
                <aside>
                    <CardSubtitle>Created: <strong>{formatDate(board.creationDate)}</strong></CardSubtitle>
                    <CardSubtitle>Last visited: <strong>{formatDate(board.lastVisited)}</strong></CardSubtitle>
                </aside>

                <div className="mt-4 mb-2">
                    <div className="card-share-link"><ShareLink linkUrl={boardLink} reducedWidthLink /></div>
                    <CardTitle><Link to={boardLink}>{board.title}</Link></CardTitle>
                    <CardSubtitle>By: <strong>{formatBoardOwner(user, board)}</strong></CardSubtitle>
                </div>
            </CardBody>
        </Card>;
};

function toActual(limit: BoardLimit) {
    if (limit == "ALL") return "ALL";
    return parseInt(limit, 10);
}
function orderName(order: BoardOrder) {
    return orderNames[order];
}

export const MyGameboards = () => {
    //Redux state and dispatch
    const dispatch = useDispatch();
    const boards = useSelector((state: AppState) => ThisBoards.boards(state) as Boards);
    const user = useSelector((state: AppState) => (state && state.user) as RegisteredUserDTO || null);

    const [boardOrder, setBoardOrder] = useState<BoardOrder>(BoardOrder.visited);
    const [loading, setLoading] = useState(false);
    const [boardView, setBoardView] = useState(isMobile() ? boardViews.card : boardViews.table);
    const [boardLimit, setBoardLimit] = useState<BoardLimit>(boardView == boardViews.table ? BoardLimit.All : BoardLimit.six);
    const [boardTitleFilter, setBoardTitleFilter] = useState<string>("");
    const [selectedBoards, setSelectedBoards] = useState<AppGameBoard[]>([]);
    const [boardCreator, setBoardCreator] = useState<boardCreators>(boardCreators.all);
    const [boardCompletion, setBoardCompletion] = useState<boardCompletions>(boardCompletions.any);
    const [levels, setLevels] = useState<string[]>([]);

    let actualBoardLimit: ActualBoardLimit = toActual(boardLimit);

    function loadInitial() {
        dispatch(loadBoards(0, actualBoardLimit, boardOrder));
        setLoading(true);
    }
    useEffect(loadInitial, [boardOrder]);

    useEffect(() => {
        actualBoardLimit = toActual(boardLimit);
        loadInitial();
    }, [boardLimit]);

    useEffect(() => {
        if (boardView == boardViews.table) {
            setBoardLimit(BoardLimit.All)
        } else if (boardView == boardViews.card) {
            setBoardLimit(BoardLimit.six)
        }
    }, [boardView]);

    function confirmDeleteMultipleBoards() {
        if (confirm(`Are you sure you want to remove ${selectedBoards && selectedBoards.length > 1 ? selectedBoards.length + " boards" : selectedBoards[0].title} from your account?`)) {
            selectedBoards && selectedBoards.map(board => dispatch(deleteBoard(board)));
            setSelectedBoards([]);
        }
    }

    function switchView(e: React.ChangeEvent<HTMLInputElement>) {
        setSelectedBoards([]);
        setBoardView(e.target.value as boardViews);
    }

    function viewMore() {
        const increment = toActual(boardLimit);
        if (increment != "ALL" && actualBoardLimit != "ALL") {
            dispatch(loadBoards(actualBoardLimit, increment, boardOrder));
            setLoading(true);
        }
    }

    useEffect( () => {
        if (boards && boards.totalResults != 0) {
            const wasLoading = loading;
            setLoading(false);
            if (boards.boards) {
                if (actualBoardLimit != boards.boards.length) {
                    actualBoardLimit = (boards.boards.length);
                    if (!wasLoading && boards.boards.length == 0) {
                        // Through deletion or something we have ended up with no boards, so fetch more.
                        viewMore();
                    }
                }
            }
        }
    }, [boards]);

    const pageHelp = <span>
        A summary of your gameboards
    </span>;

    return <Container>
        <TitleAndBreadcrumb currentPageTitle="My gameboards" help={pageHelp} />
        {boards && boards.totalResults == 0 ?
            <h3 className="text-center mt-4 mb-5">You have no gameboards to view.</h3>
            :
            <React.Fragment>
                <div className="mt-4 mb-2">
                    {boards && boards.totalResults > 0 && <h4>You have <strong>{boards.totalResults}</strong> gameboard{boards.totalResults > 1 && "s"} saved...</h4>}
                    {!boards && <h4>You have <Spinner size="sm" /> saved gameboards...</h4>}
                </div>
                <div>
                    {boardView !== boardViews.table && <Row>
                        <Col sm={6} lg={3} xl={2}>
                            <Label className="w-100">
                                Display in <Input type="select" value={boardView} onChange={switchView}>
                                    {Object.values(boardViews).map(view => <option key={view} value={view}>{view}</option>)}
                                </Input>
                            </Label>
                        </Col>
                        <div className="d-lg-none w-100" />
                        <Col xs={6} lg={{size: 2, offset: 3}} xl={{size: 2, offset: 4}}>
                            <Label className="w-100">
                                Show <Input type="select" value={boardLimit} onChange={e => setBoardLimit(e.target.value as BoardLimit)}>
                                    {Object.values(BoardLimit).map(limit => <option key={limit} value={limit}>{limit}</option>)}
                                </Input>
                            </Label>
                        </Col>
                        <Col xs={6} lg={4}>
                            <Label className="w-100">
                                Sort by <Input type="select" value={boardOrder} onChange={e => setBoardOrder(e.target.value as BoardOrder)}>
                                    {Object.values(BoardOrder).map(order => <option key={order} value={order}>{orderName(order)}</option>)}
                                </Input>
                            </Label>
                        </Col>
                    </Row>}
                </div>
                <ShowLoading until={boards}>
                    {boards && boards.boards && <div>
                        {boardView == boardViews.card ?
                            // Card view
                            <div>
                                <div className="block-grid-xs-1 block-grid-md-2 block-grid-lg-3 my-2">
                                    {boards.boards.map(board => <div key={board.id}>
                                        <Board
                                            key={board.id}
                                            board={board}
                                            selectedBoards={selectedBoards}
                                            setSelectedBoards={setSelectedBoards}
                                            boardView={boardView}
                                            user={user}
                                            boards={boards}
                                        />
                                    </div>)}
                                </div>
                                <div className="text-center mt-2 mb-5" style={{clear: "both"}}>
                                    <p>Showing <strong>{boards.boards.length}</strong> of <strong>{boards.totalResults}</strong></p>
                                    {boards.boards.length < boards.totalResults && <Button onClick={viewMore} disabled={loading}>{loading ? <Spinner /> : "View more"}</Button>}
                                </div>
                            </div>
                            :
                            // Table view
                            <div>
                                <Row>
                                    <Col sm={6} lg={3} xl={2}>
                                        <Label className="w-100">
                                            Display in <Input type="select" value={boardView} onChange={e => switchView(e)}>
                                                {Object.values(boardViews).map(view => <option key={view} value={view}>{view}</option>)}
                                            </Input>
                                        </Label>
                                    </Col>
                                </Row>
                                <Card className="mt-2 mb-5">
                                    <CardBody id="boards-table">
                                        <Row>
                                            <Col lg={4}>
                                                <Label className="w-100">
                                                    Filter boards <Input type="text" onChange={(e) => setBoardTitleFilter(e.target.value)} placeholder="Filter boards by name"/>
                                                </Label>
                                            </Col>
                                            <Col sm={6} lg={{size: 3, offset: 1}}>
                                                <Label className="w-100">Levels
                                                    <Select inputId="levels-select"
                                                        isMulti
                                                        options={[
                                                            { value: '1', label: '1' },
                                                            { value: '2', label: '2' },
                                                            { value: '3', label: '3' },
                                                            { value: '4', label: '4' },
                                                            { value: '5', label: '5' },
                                                            { value: '6', label: '6' },
                                                        ]}
                                                        name="colors"
                                                        className="basic-multi-select"
                                                        classNamePrefix="select"
                                                        placeholder="None"
                                                        onChange={multiSelectOnChange(setLevels)}
                                                    />
                                                </Label>
                                            </Col>
                                            <Col sm={6} lg={2}>
                                                <Label className="w-100">
                                                    Creator <Input type="select" value={boardCreator} onChange={e => setBoardCreator(e.target.value as boardCreators)}>
                                                        {Object.values(boardCreators).map(creator => <option key={creator} value={creator}>{creator}</option>)}
                                                    </Input>
                                                </Label>
                                            </Col>
                                            <Col sm={6} lg={2}>
                                                <Label className="w-100">
                                                    Completion <Input type="select" value={boardCompletion} onChange={e => setBoardCompletion(e.target.value as boardCompletions)}>
                                                        {Object.values(boardCompletions).map(completion => <option key={completion} value={completion}>{completion}</option>)}
                                                    </Input>
                                                </Label>
                                            </Col>
                                        </Row>

                                        <div className="overflow-auto mt-3">
                                            <Table className="mb-0">
                                                <thead>
                                                    <tr>
                                                        <th className="align-middle">Completion</th>
                                                        <th className="align-middle pointer-cursor">
                                                            <button className="table-button" onClick={() => boardOrder == BoardOrder.title ? setBoardOrder(BoardOrder["-title"]) : setBoardOrder(BoardOrder.title)}>
                                                                Board name {boardOrder == BoardOrder.title ? sortIcon.ascending : boardOrder == BoardOrder["-title"] ? sortIcon.descending : sortIcon.sortable}
                                                            </button>
                                                        </th>
                                                        {SITE_SUBJECT == SITE.PHY && <th className="text-center align-middle">Levels</th>}
                                                        <th className="text-center align-middle">Creator</th>
                                                        <th className="text-center align-middle pointer-cursor">
                                                            <button className="table-button" onClick={() => boardOrder == BoardOrder.created ? setBoardOrder(BoardOrder["-created"]) : setBoardOrder(BoardOrder.created)}>
                                                                Created {boardOrder == BoardOrder.created ? sortIcon.ascending : boardOrder == BoardOrder["-created"] ? sortIcon.descending : sortIcon.sortable}
                                                            </button>
                                                        </th>
                                                        <th className="text-center align-middle pointer-cursor">
                                                            <button className="table-button" onClick={() => boardOrder == BoardOrder.visited ? setBoardOrder(BoardOrder["-visited"]) : setBoardOrder(BoardOrder.visited)}>
                                                                Last viewed {boardOrder == BoardOrder.visited ? sortIcon.ascending : boardOrder == BoardOrder["-visited"] ? sortIcon.descending : sortIcon.sortable}
                                                            </button>
                                                        </th>
                                                        <th colSpan={2}>
                                                            <div className="text-right align-middle">
                                                                <Button disabled={selectedBoards.length == 0} className="btn-sm" onClick={confirmDeleteMultipleBoards}>
                                                                    {`Delete (${selectedBoards.length})`}
                                                                </Button>
                                                            </div>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {boards.boards
                                                        .filter(board => board.title && board.title.toLowerCase().includes(boardTitleFilter.toLowerCase())
                                                        && (formatBoardOwner(user, board) == boardCreator || boardCreator == "All")
                                                        && (boardCompletionSelection(board, boardCompletion))
                                                        && (boardLevelsSelection(board, levels))) // && (boardCompletionSelection(board, boardCompletion)
                                                        .map(board =>
                                                            <Board
                                                                key={board.id}
                                                                board={board}
                                                                selectedBoards={selectedBoards}
                                                                setSelectedBoards={setSelectedBoards}
                                                                boardView={boardView}
                                                                user={user}
                                                                boards={boards}
                                                            />)
                                                    }
                                                </tbody>
                                            </Table>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>}
                    </div>}
                </ShowLoading>
            </React.Fragment>}
    </Container>;
};
