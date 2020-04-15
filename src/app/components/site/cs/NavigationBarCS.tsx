import React from "react";
import {LinkItem, NavigationBar, NavigationSection, useAssignmentBadge} from "../../navigation/NavigationBar";
import {useSelector} from "react-redux";
import {AppState} from "../../../state/reducers";
import {isAdmin, isAdminOrEventManager, isEventLeader, isLoggedIn, isStaff, isTeacher} from "../../../services/user";

export const NavigationBarCS = () => {
    const user = useSelector((state: AppState) => (state && state.user) || null);
    const assignmentBadge = useAssignmentBadge();

    return <NavigationBar>
        <NavigationSection title={<>Students {assignmentBadge}</>} topLevelLink={!isLoggedIn(user)} to="/students">
            <LinkItem to="/assignments">My assignments {assignmentBadge}</LinkItem>
            <LinkItem to="/my_gameboards">My gameboards</LinkItem>
            <LinkItem to="/progress">My progress</LinkItem>
            <LinkItem to="/student_rewards">Student rewards</LinkItem>
        </NavigationSection>

        {isTeacher(user) && <NavigationSection title="Teachers">
            <LinkItem to="/teachers">Teacher tools</LinkItem>
            <LinkItem to="/set_assignments">Set assignments</LinkItem>
            <LinkItem to="/assignment_progress">My markbook</LinkItem>
            <LinkItem to="/groups">Manage groups</LinkItem>
            <LinkItem to="/teaching_order">Suggested teaching order</LinkItem>
        </NavigationSection>}

        <NavigationSection title="Topics">
            <LinkItem to="/topics">All topics</LinkItem>
            <LinkItem to="/pages/specification_page_aqa">AQA specification view</LinkItem>
            <LinkItem to="/pages/specification_page_ocr">OCR specification view</LinkItem>
        </NavigationSection>

        <NavigationSection title="Events">
            <LinkItem to="/events?types=teacher">Teacher events</LinkItem>
            <LinkItem to="/events?types=student">Student events</LinkItem>
        </NavigationSection>

        <NavigationSection title={<React.Fragment>
            <span className="d-md-none d-lg-inline">Help and support</span>
            <span className="d-none d-md-inline d-lg-none">Support</span>
        </React.Fragment>}>
            <LinkItem to="/support/teacher">Teacher support</LinkItem>
            <LinkItem to="/support/student">Student support</LinkItem>
            <LinkItem to="/contact">Contact us</LinkItem>
        </NavigationSection>

        {(isStaff(user) || isEventLeader(user)) && <NavigationSection title="Admin">
            {isStaff(user) && <LinkItem to="/admin">Admin tools</LinkItem>}
            {isAdmin(user) && <LinkItem to="/admin/usermanager">User manager</LinkItem>}
            {(isEventLeader(user) || isAdminOrEventManager(user)) && <LinkItem to="/admin/events">Event admin</LinkItem>}
            {isStaff(user) && <LinkItem to="/admin/stats">Site statistics</LinkItem>}
            {isStaff(user) && <LinkItem to="/admin/content_errors">Content errors</LinkItem>}
        </NavigationSection>}
    </NavigationBar>
};