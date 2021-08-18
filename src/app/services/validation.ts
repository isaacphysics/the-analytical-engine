import {
    AdditionalInformation,
    AugmentedEvent,
    BooleanNotation,
    NOT_FOUND_TYPE,
    UserEmailPreferences,
    UserPreferencesDTO,
    ValidationUser
} from "../../IsaacAppTypes";
import {UserContext, UserSummaryWithEmailAddressDTO} from "../../IsaacApiTypes";
import {FAILURE_TOAST} from "../components/navigation/Toasts";
import {SITE, SITE_SUBJECT} from "./siteConstants";
import {STAGE, BOOLEAN_NOTATION, EXAM_BOARD, NOT_FOUND} from "./constants";

export function atLeastOne(possibleNumber?: number): boolean {return possibleNumber !== undefined && possibleNumber > 0}
export function zeroOrLess(possibleNumber?: number): boolean {return possibleNumber !== undefined && possibleNumber <= 0}

export const validateEmail = (email?: string) => {
    return email && email.length > 0 && email.includes("@");
};

export const isValidGameboardId = (gameboardId?: string) => {
    return !gameboardId || /^[a-z0-9_-]+$/.test(gameboardId);
};

export const isDobOverThirteen = (dateOfBirth?: Date) => {
    if (dateOfBirth) {
        const today = new Date();
        const thirteenYearsAgo = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
        const hundredAndTwentyYearsAgo = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
        return hundredAndTwentyYearsAgo <= dateOfBirth && dateOfBirth <= thirteenYearsAgo;
    } else {
        return false;
    }
};

export const MINIMUM_PASSWORD_LENGTH = 6;
export const validatePassword = (password: string) => {
    return password.length >= MINIMUM_PASSWORD_LENGTH;
};

export const validateEmailPreferences = (emailPreferences?: UserEmailPreferences | null) => {
    return emailPreferences && [
        emailPreferences.ASSIGNMENTS,
        emailPreferences.EVENTS,
        emailPreferences.NEWS_AND_UPDATES
    ].reduce(
        // Make sure all expected values are either true or false
        (prev, next) => prev && (next === true || next === false),
        true
    );
};

export function validateUserContexts(userContexts?: UserContext[]): boolean {
    if (userContexts === undefined) {return false;}
    if (userContexts.length === 0) {return false;}
    return userContexts.every(uc =>
        Object.values(STAGE).includes(uc.stage as STAGE) && //valid stage
        (SITE_SUBJECT !== SITE.CS || Object.values(EXAM_BOARD).includes(uc.examBoard as EXAM_BOARD)) // valid exam board for cs
    );
}

export const validateUserSchool = (user?: ValidationUser | null) => {
    return !!user && (
        (!!user.schoolId) ||
        (!!user.schoolOther && user.schoolOther.length > 0)
    );
};

export const validateUserGender = (user?: ValidationUser | null) => {
    return user && user.gender && user.gender !== "UNKNOWN";
};

export const validateBooleanNotation = (booleanNotation? : BooleanNotation | null) => {
    // Make sure at most one of the possible keys are true at a time
    return booleanNotation && Object.keys(BOOLEAN_NOTATION)
        .filter(key => (key !== BOOLEAN_NOTATION.NONE && (booleanNotation[key as keyof BooleanNotation] || false)))
        .length <= 1;
}

const withinLastNMinutes = (nMinutes: number, dateOfAction: string | null) => {
    if (dateOfAction) {
        const now = new Date();
        const nMinutesAgo = new Date(now.getTime() - nMinutes * 60 * 1000);
        const actionTime = new Date(dateOfAction);
        return nMinutesAgo <= actionTime && actionTime <= now;
    } else {
        return false;
    }
};
export const withinLast50Minutes = withinLastNMinutes.bind(null, 50);

export function allRequiredInformationIsPresent(user?: ValidationUser | null, userPreferences?: UserPreferencesDTO | null, userContexts?: UserContext[]) {
    return user && userPreferences &&
        (SITE_SUBJECT !== SITE.CS || (validateUserSchool(user) && validateUserGender(user))) &&
        (userPreferences.EMAIL_PREFERENCE === null || validateEmailPreferences(userPreferences.EMAIL_PREFERENCE)) &&
        validateUserContexts(userContexts);
}

export function validateBookingSubmission(event: AugmentedEvent, user: UserSummaryWithEmailAddressDTO, additionalInformation: AdditionalInformation) {
    if (!validateUserSchool(Object.assign({password: null}, user))) {
        return Object.assign({}, FAILURE_TOAST, {title: "School information required", body: "You must enter a school in order to book on to this event."});
    }

    // validation for users / forms that indicate the booker is not a teacher
    if (user.role == 'STUDENT' && !(additionalInformation.yearGroup == 'TEACHER' || additionalInformation.yearGroup == 'OTHER')) {
        if (!additionalInformation.yearGroup) {
            return Object.assign({}, FAILURE_TOAST, {title:"Year group required", body: "You must enter a year group to proceed."});
        }

        if (!event.isVirtual && (!additionalInformation.emergencyName || !additionalInformation.emergencyNumber)) {
            return Object.assign({}, FAILURE_TOAST, {title: "Emergency contact details required", body: "You must enter a emergency contact details in order to book on to this event."});
        }
    }

    // validation for users that are teachers
    if (user.role != 'STUDENT' && !additionalInformation.jobTitle) {
        return Object.assign({}, FAILURE_TOAST, {title: "Job title required", body: "You must enter a job title to proceed."});
    }

    return true;
}

export const resourceFound = <T>(resource: undefined | null | NOT_FOUND_TYPE | T): resource is T => {
    return resource !== undefined && resource !== null && resource !== NOT_FOUND;
};

export function safePercentage(correct: number | null | undefined, attempts: number | null | undefined) {
    return (!(correct || correct == 0) || !attempts) ? null : correct / attempts * 100;
}
