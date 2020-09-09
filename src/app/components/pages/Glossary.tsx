import React, {useEffect, useMemo, useRef, useState} from "react";
import {Col, Container, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Input, Label, Row} from "reactstrap";
import {AppState} from "../../state/reducers";
import {ShowLoading} from "../handlers/ShowLoading";
import {useSelector} from "react-redux";
import {withRouter} from "react-router-dom";
import {TitleAndBreadcrumb} from "../elements/TitleAndBreadcrumb";
import {ShareLink} from "../elements/ShareLink";
import {PrintButton} from "../elements/PrintButton";
import {IsaacGlossaryTerm} from '../../components/content/IsaacGlossaryTerm';
import {GlossaryTermDTO} from "../../../IsaacApiTypes";
import {TempExamBoardPicker} from '../elements/inputs/TempExamBoardPicker';
import _startCase from 'lodash/startCase';
import {scrollVerticallyIntoView} from "../../services/scrollManager";
import { isDefined } from '../../services/miscUtils';

interface GlossaryProps {
    location: { hash: string },
}

export const Glossary = withRouter(({ location: { hash } }: GlossaryProps) => {
    const [searchText, setSearchText] = useState("");
    const [topics, setTopics] = useState<string[]>([]);
    const [filterTopic, setFilterTopic] = useState("");
    const [topicsDropdownOpen, setTopicsDropdownOpen] = useState(false);

    const rawGlossaryTerms = useSelector((state: AppState) => state && state.glossaryTerms);

    const glossaryTerms = useMemo(() => {
        if (searchText === '') {
            const sortedTerms = rawGlossaryTerms?.sort((a, b) => (a?.value && b?.value && a.value.localeCompare(b.value)) || 0);
            const groupedTerms: { [key: string]: GlossaryTermDTO[] } = {};
            let _topics: string[] = [];
            if (sortedTerms) {
                for (const term of sortedTerms) {
                    if (filterTopic !== "" && !term.tags?.includes(filterTopic)) continue;
                    const k = term?.value?.[0] || '#';
                    groupedTerms[k] = [...(groupedTerms[k] || []), term];
                    _topics = [..._topics, ...(term.tags || [])];
                }
            }
            setTopics([...new Set(
                _topics.sort((a, b) => a.localeCompare(b))
            )]);
            return groupedTerms;
        } else {
            const regex = new RegExp(searchText.split(' ').join('|'), 'gi');
            const sortedTerms = rawGlossaryTerms?.filter(e => e.value?.match(regex)).sort((a, b) => (a?.value && b?.value && a.value.localeCompare(b.value)) || 0);
            const groupedTerms: { [key: string]: GlossaryTermDTO[] } = {};
            let _topics: string[] = [];
            if (sortedTerms) {
                for (const term of sortedTerms) {
                    if (filterTopic !== "" && !term.tags?.includes(filterTopic)) continue;
                    const k = term?.value?.[0] || '#';
                    groupedTerms[k] = [...(groupedTerms[k] || []), term];
                    _topics = [..._topics, ...(term.tags || [])];
                }
            }
            setTopics([...new Set(
                _topics.sort((a, b) => a.localeCompare(b))
            )]);
            return groupedTerms;
        }
    }, [rawGlossaryTerms, filterTopic, searchText]);

    const scrollToKey = (k: string) => {
        const element = document.getElementById(`key-${k}`);
        const link = document.getElementById(`alphascroller-key-${k}`);

        if (isDefined(element)) {
            scrollVerticallyIntoView(element, -70);
        }
        link?.blur();
    }

    const onKeyUpScrollTo = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            scrollToKey(event.currentTarget.getAttribute('key') || '');
        }
    }    

    useEffect(() => {
        if (hash.includes("#")) {
            const hashAnchor = hash.slice(1);
            const element = document.getElementById(hashAnchor);
            if (element) { // exists on page
                scrollVerticallyIntoView(element, -70);
            }
        }
    }, [hash]);

    /* Horror lies ahead. Sorry. */
    const alphabetScrollerSentinel = useRef<HTMLDivElement | null>(null);
    const alphabetScrollerFlag = useRef(false);
    const alphabetScrollerObserver = useRef<IntersectionObserver>();

    const alphabetScrollerCallback = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
        console.log('thingu');
        for (const entry of entries) {
            if (entry.target.id === 'sentinel') {
                if (entry.isIntersecting) {
                    document.getElementById('stickyalphabetlist')?.classList.remove('active');
                } else {
                    if (entry.boundingClientRect.top <= 0) {
                        // Gone up
                        document.getElementById('stickyalphabetlist')?.classList.add('active');
                    } else if (entry.boundingClientRect.top > 0) {
                        // Gone down
                        document.getElementById('stickyalphabetlist')?.classList.remove('active');
                    }
                }
            }
        }
    }

    useEffect(() => {
        if (alphabetScrollerSentinel.current && !alphabetScrollerObserver.current && !alphabetScrollerFlag.current) {
            const options = {
                root: null,
                rootMargin: '0px',
                threshold: 1.0,
            }

            alphabetScrollerObserver.current = new IntersectionObserver(alphabetScrollerCallback, options);
            alphabetScrollerObserver.current.observe(alphabetScrollerSentinel.current);
            alphabetScrollerFlag.current = true;

            // Uncommenting this return, disconnects the observer. Not sure why.
            // return () => alphabetScrollerObserver?.current?.disconnect();
        }
    });
    /* Horror stops here. Or not, depending who you ask. */

    const alphabetList = glossaryTerms && '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(k => {
        if (glossaryTerms.hasOwnProperty(k)) {
            return <div id={`alphascroller-key-${k}`} className="key" key={k} role="button" tabIndex={0} onKeyUp={onKeyUpScrollTo} onClick={() => scrollToKey(k)}>
                {k}
            </div>
        } else {
            return <div className="key unavailable" key={k}>
                {k}
            </div>
        }
    })

    const thenRender = <div className="glossary-page">
        <Container>
            <TitleAndBreadcrumb currentPageTitle="Glossary" />
            <div className="no-print d-flex align-items-center">
                <div className="question-actions question-actions-leftmost mt-3">
                    <ShareLink linkUrl={`/glossary`}/>
                </div>
                <div className="question-actions mt-3 not_mobile">
                    <PrintButton/>
                </div>
            </div>

            <Row>
                <Col md={{size: 9}} className="py-4">
                    <Row>
                        <Col md={{size: 4}}>
                            <Label for='terms-search' className='sr-only'>Search by term</Label>
                            <Input
                                id="terms-search" type="search" name="query" placeholder="Search by term" aria-label="Search by term"
                                value={searchText} onChange={e => setSearchText(e.target.value)}
                            />
                        </Col>
                        <Col className="mt-3 mt-md-0">
                            <Label for='topic-select' className='sr-only'>Topic</Label>
                            {topics?.length > 0 && <Dropdown isOpen={topicsDropdownOpen} toggle={() => setTopicsDropdownOpen(prevState => !prevState)}>
                                <DropdownToggle caret color="outline-primary">
                                    { filterTopic === "" ? "Filter by topic" : _startCase(filterTopic) }
                                </DropdownToggle>
                                <DropdownMenu>
                                    <DropdownItem onClick={() => setFilterTopic("")}>All topics</DropdownItem>
                                    {topics.map(e => <DropdownItem key={e} onClick={() => setFilterTopic(e)}>{_startCase(e.replace(/[^a-zA-Z0-9]/, ' '))}</DropdownItem>)}
                                </DropdownMenu>
                            </Dropdown>}
                        </Col>
                    </Row>
                </Col>
                <Col md={{size: 3}} className="py-4">
                    <TempExamBoardPicker className="text-right" />
                </Col>
            </Row>
            {(!glossaryTerms || Object.entries(glossaryTerms).length === 0) && <Row>
                <Col md={{size: 8, offset: 2}} className="py-4">
                    {searchText === "" && <p>There are no glossary terms in the glossary yet! Please try again later.</p>}
                    {searchText !== "" && <p>We could not find glossary terms to match your search criteria.</p>}
                </Col>
            </Row>}
            {glossaryTerms && Object.keys(glossaryTerms).length > 0 && <Col className="pt-2 pb-4">
                <div id="sentinel" ref={alphabetScrollerSentinel}>&nbsp;</div>
                <div id="stickyalphabetlist" className="alphabetlist pb-4">
                    {alphabetList}
                </div>
                <div className="alphabetlist pb-4">
                    {alphabetList}
                </div>
                {Object.entries(glossaryTerms).map(([key, terms]) => <Row key={key} className="pb-5">
                    <Col md={{size: 1, offset: 1}} id={`key-${key}`}><h2 style={{position: 'sticky', top: '1em'}}>{key}</h2></Col>
                    <Col>
                        {terms.map(term => <Row key={term.id}>
                            <Col md={{size: 10}}>
                                <IsaacGlossaryTerm doc={term} />
                            </Col>
                        </Row>)}
                    </Col>
                </Row>)}
            </Col>}
        </Container>
    </div>

    return <ShowLoading until={glossaryTerms} thenRender={() => thenRender}/>;
});