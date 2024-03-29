import React from "react";
import {Link} from "react-router-dom";
import {Badge, Col, Container, Row} from "reactstrap";
import {TitleAndBreadcrumb} from "../elements/TitleAndBreadcrumb";
import {Tag} from "../../../IsaacAppTypes";
import {
    STAGE,
    TAG_ID,
    tags,
    useHashState
} from "../../services";
import {PageFragment} from "../elements/PageFragment";
import {RenderNothing} from "../elements/RenderNothing";
import {MetaDescription} from "../elements/MetaDescription";
import classNames from "classnames";
import {Tabs} from "../elements/Tabs";
import {TypeGuard} from "@reduxjs/toolkit/dist/tsHelpers";

const renderTopic = (topic: Tag) => {
    if (!topic.hidden) {
        return <>
            {topic.comingSoonDate
                ? <span className={"font-weight-semi-bold"}>{topic.title}</span>
                : <Link
                    to={topic.comingSoonDate ? "/coming_soon" : `/topics/${topic.id}`}
                    className={classNames("font-weight-semi-bold", {"text-muted": topic.comingSoonDate})}
                >
                    {topic.title}
                </Link>
            }
            {" "}
            {topic.comingSoonDate && !topic.new &&
            <Badge color="light" className="border bg-white">Coming {topic.comingSoonDate}</Badge>}
            {topic.new && !topic.comingSoonDate && <Badge color="secondary">New</Badge>}
        </>;
    }
};

const topicColumn = (subTags: Tag[], stage: STAGE.ALL | STAGE.A_LEVEL | STAGE.GCSE) => {
    return <Col key={TAG_ID.computerScience + "_" + subTags[0].id} md={6}>
        {subTags.sort((a, b) => (a.title > b.title) ? 1 : -1)
            // Overwrite subcategory with stage properties
            .map(subcategory => ({...subcategory, ...subcategory.stageOverride?.[stage]}))
            .map(subcategory => {
                    const subcategoryDescendentIds = tags.getDescendents(subcategory.id).map(t => t.id);
                    const topicTags = tags.getTopicTags(subcategoryDescendentIds);
                    const topicComponents =
                        topicTags
                            // Overwrite subcategory with stage properties
                            .map(topic => ({...topic, ...topic.stageOverride?.[stage]}))
                            .map(topic => <li className="border-0 px-0 py-0 pb-1 bg-transparent" key={topic.id}>
                                {renderTopic(topic)}
                            </li>);
                    if (!subcategory.hidden && topicComponents.length > 0) {
                        return <React.Fragment key={subcategory.id}>
                            <h3>{subcategory.title}</h3>
                            <ul className="list-unstyled mb-3 link-list">
                                {topicComponents}
                            </ul>
                        </React.Fragment>
                    }
                }
            )}
    </Col>
};

export const AllTopics = () => {
    const subcategoryTags = tags.allSubcategoryTags;

    //const existingLocation = useLocation();
    //const {stage: view, setStage: setTransientStage} = useUserContext();
    const checkStage = ((a: any) => [STAGE.ALL, STAGE.A_LEVEL, STAGE.GCSE].includes(a)) as TypeGuard<STAGE.A_LEVEL | STAGE.GCSE | STAGE.ALL>;
    const [stage, setStage] = useHashState<STAGE.A_LEVEL | STAGE.GCSE | STAGE.ALL>(STAGE.ALL, checkStage);
    // TODO update users transient user context so they see the correct topics etc. when clicking through?
    // useEffect(() => {
    //     setTransientStage(stage);
    //     const actualParams = queryString.parse(window.location.search);
    //     if (stage !== actualParams.stage) {
    //         try {
    //             history.replace({
    //                 ...existingLocation,
    //                 search: queryString.stringify({
    //                     ...actualParams,
    //                     stage,
    //                 }, {encode: false})
    //             });
    //         } catch (e) {
    //             // This is to handle the case where the existingLocation pathname is invalid, i.e. "isaacphysics.org//".
    //             // In that case history.replace(...) throws an exception, and it will do this while the ErrorBoundary is
    //             // trying to render, causing a loop and a spike in client-side errors.
    //         }
    //     }
    // }, [stage]);

    const charToCutAt = "D";
    const firstColTags = subcategoryTags.filter(function (subcategory) {return subcategory.title.charAt(0) <= charToCutAt});
    const secondColTags = subcategoryTags.filter(function (subcategory) {return subcategory.title.charAt(0) > charToCutAt});

    const metaDescription = ({
        [STAGE.ALL]: "Discover our free computer science topics and questions. Learn or revise for your exams with us today.",
        [STAGE.A_LEVEL]: "Discover our free A level computer science topics and questions. We cover AQA, CIE, OCR, Eduqas, and WJEC. Learn or revise for your exams with us today.",
        [STAGE.GCSE]: "Discover our free GCSE computer science topics and questions. We cover AQA, Edexcel, Eduqas, OCR, and WJEC. Learn or revise for your exams with us today."
    })[stage];

    const tabs = {
        ["All topics"]: <>
            <Row>
                <Col lg={{size: 8, offset: 2}} className="pt-3 pt-md-4">
                    <PageFragment fragmentId={`${STAGE.ALL}_all_topics`} ifNotFound={RenderNothing} />
                </Col>
            </Row>
            <Row>
                <Col lg={{size: 8, offset: 2}} className="py-md-4 row">
                    {topicColumn(firstColTags, STAGE.ALL)}
                    {topicColumn(secondColTags, STAGE.ALL)}
                </Col>
            </Row>
        </>,
        ["A Level topics"]: <>
            <Row>
                <Col lg={{size: 8, offset: 2}} className="pt-3 pt-md-4">
                    <PageFragment fragmentId={`${STAGE.A_LEVEL}_all_topics`} ifNotFound={RenderNothing} />
                </Col>
            </Row>
            <Row>
                <Col lg={{size: 8, offset: 2}} className="py-md-4 row">
                    {topicColumn(firstColTags, STAGE.A_LEVEL)}
                    {topicColumn(secondColTags, STAGE.A_LEVEL)}
                </Col>
            </Row>
        </>,
        ["GCSE topics"]: <>
            <Row>
                <Col lg={{size: 8, offset: 2}} className="pt-3 pt-md-4">
                    <PageFragment fragmentId={`${STAGE.GCSE}_all_topics`} ifNotFound={RenderNothing} />
                </Col>
            </Row>
            <Row>
                <Col lg={{size: 8, offset: 2}} className="py-md-4 row">
                    {topicColumn(firstColTags, STAGE.GCSE)}
                    {topicColumn(secondColTags, STAGE.GCSE)}
                </Col>
            </Row>
        </>
    };

    return <div id={"topics-bg"}>
        <Container className={"mb-4"}>
            <TitleAndBreadcrumb currentPageTitle={"Topics"} />
            <MetaDescription description={metaDescription} />
            <Tabs style={"buttons"} activeTabOverride={[STAGE.ALL, STAGE.A_LEVEL, STAGE.GCSE].indexOf(stage) + 1}
                  onActiveTabChange={(activeTab) => setStage(([STAGE.ALL, STAGE.A_LEVEL, STAGE.GCSE].at(activeTab - 1) ?? STAGE.ALL) as STAGE.A_LEVEL | STAGE.GCSE | STAGE.ALL)}
                  className={"mt-3"}
            >
                {tabs}
            </Tabs>
        </Container>
    </div>;
};
