import {Col, Container} from "reactstrap";
import React from "react";
import {TitleAndBreadcrumb} from "../../elements/TitleAndBreadcrumb";
import {STUDENTS_CRUMB} from "../../../services/constants";
import {PageFragment} from "../../elements/PageFragment";

export const QuantumMechanicsPrimer = () => {

    const pageHelp = <span>
        The Isaac Physics Quantum Mechanics Primer
    </span>;

    return <Container className="physics">
        <Col>
            <div className="book-intro">
                <TitleAndBreadcrumb className="mb-5" currentPageTitle="Quantum Mechanics Primer" intermediateCrumbs={[STUDENTS_CRUMB]} help={pageHelp} />
                <PageFragment fragmentId="quantum_mechanics_primer_intro"/>
            </div>
        </Col>
    </Container>
};
