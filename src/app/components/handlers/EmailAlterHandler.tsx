import React, {useEffect} from 'react';
import {connect} from "react-redux";
import {handleEmailAlter, requestCurrentUser} from "../../state/actions";
import {Button, Col, Container} from "reactstrap";
import {AppState, ErrorState} from "../../state/reducers";
import {history} from "../../services/history";
import queryString from "query-string";

const stateToProps = (state: AppState, {location: {search}}: {location: {search?: string}}) => ({
    errorMessage: state ? state.error : null,
    queryParams: search ? queryString.parse(search) : {}
});
const dispatchToProps = {handleEmailAlter, requestCurrentUser};

interface EmailAlterHandlerProps {
    queryParams: {userid?: string; token?: string};
    handleEmailAlter: (params: {userid: string | null; token: string | null}) => void;
    errorMessage: ErrorState;
    requestCurrentUser: () => void;
}

const EmailAlterHandlerComponent = ({queryParams: {userid, token}, handleEmailAlter, errorMessage, requestCurrentUser}: EmailAlterHandlerProps) => {
    useEffect(() => {
        if (userid && token) {
            handleEmailAlter({userid, token});
        }
    }, []);

    return <Container id="email-verification">
        {(!errorMessage || errorMessage.type !== "generalError") &&
            <div>
                <h3>Email address verified</h3>
                <Col>
                    <Button color="secondary" onClick={() => {
                        requestCurrentUser();
                        history.push('/account');
                    }} block >
                        Go to My Account
                    </Button>
                </Col>
            </div>
        }
        {errorMessage && errorMessage.type === "generalError" &&
            <div>
                <h3>{"Couldn't verify email address"}</h3>
                <p>{errorMessage.generalError}</p>
            </div>
        }
    </Container>;
};

export const EmailAlterHandler = connect(stateToProps, dispatchToProps)(EmailAlterHandlerComponent);
