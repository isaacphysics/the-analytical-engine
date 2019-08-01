import {store} from "../../state/store";
import {closeActiveModal, updateCurrentUser} from "../../state/actions";
import React, {useState} from "react";
import * as RS from "reactstrap";
import {UserEmailPreference} from "./UserEmailPreferences";
import {UserEmailPreferences} from "../../../IsaacAppTypes";
import {useDispatch, useSelector} from "react-redux";
import {AppState} from "../../state/reducers";
import {validateEmailPreferences} from "../../services/validation";
import {isMobile} from "../../services/device";

const UserPreferencesModalBody = () => {
    const dispatch = useDispatch();
    const user = useSelector((state: AppState) => state && state.user);
    const userPreferences = useSelector((state: AppState) => state && state.userPreferences);

    const [submissionAttempted, setSubmissionAttempted] = useState(false);
    const [emailPreferences, setEmailPreferences] = useState<UserEmailPreferences>(
        (userPreferences && userPreferences.EMAIL_PREFERENCE) ? userPreferences.EMAIL_PREFERENCE : {}
    );

    function updateEmailPreferencesInModalScope(newEmailPreferences: UserEmailPreferences) {
        setEmailPreferences(Object.assign({}, emailPreferences, newEmailPreferences));
    }

    const emailPreferencesAreValid = validateEmailPreferences(emailPreferences)

    function formSubmission(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmissionAttempted(true);
        if (user && user.loggedIn && emailPreferencesAreValid) {
            const password = null;
            dispatch(updateCurrentUser(Object.assign(user, {password}), {EMAIL_PREFERENCE: emailPreferences}, password, user));
            dispatch(closeActiveModal());
        }
    }

    return <RS.Form onSubmit={formSubmission}>
        <UserEmailPreference
            emailPreferences={emailPreferences}
            setEmailPreferences={updateEmailPreferencesInModalScope}
            idPrefix="modal-"
            submissionAttempted={submissionAttempted}
        />

        <RS.Row className="text-center border-top p-3 p-sm-4">
            <RS.Col size={6}>
                <RS.Input value={isMobile() ? "Dismiss" : "Dismiss for now"} type="button" className="btn btn-block btn-primary-outline px-0 px-md-2 my-1" onClick={() => dispatch(closeActiveModal())} />
            </RS.Col>
            <RS.Col size={6}>
                <RS.Input value={isMobile() ? "Update" : "Update account"} type="submit" className="btn btn-block btn-secondary border-0 px-0 px-md-2 my-1" />
            </RS.Col>
        </RS.Row>
    </RS.Form>
};

export const userPreferencesModal = {
    title: "Required account information",
    body: <UserPreferencesModalBody />,
    closeAction: () => store.dispatch(closeActiveModal())
};