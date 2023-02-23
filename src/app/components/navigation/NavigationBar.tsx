import React, {HTMLProps, useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {isaacApi, loadQuizAssignedToMe, selectors, useAppDispatch, useAppSelector} from "../../state";
import {
    Badge,
    Collapse, Dropdown,
    DropdownItem,
    DropdownItemProps,
    DropdownMenu,
    DropdownToggle,
    Nav,
    Navbar,
    NavbarToggler,
    NavLink,
} from "reactstrap";
import {
    filterAssignmentsByStatus,
    isAda,
    isFound,
    partitionCompleteAndIncompleteQuizzes,
    isLoggedIn,
    isPhy, siteSpecific
} from "../../services";
import {RenderNothing} from "../elements/RenderNothing";
import classNames from "classnames";
import {skipToken} from "@reduxjs/toolkit/query";

export const MenuOpenContext = React.createContext<{menuOpen: boolean; setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>}>({
    menuOpen: false, setMenuOpen: () => {}
});

export const LinkItem = ({children, muted, badgeTitle, ...props}: React.PropsWithChildren<DropdownItemProps & {muted?: boolean, badgeTitle?: string}>) => {
    const className = classNames(siteSpecific("pl-4 py-3 p-md-3", "pl-2 py-2 p-nav-3 font-h4"), {"text-muted": muted});
    return <DropdownItem tag={Link} className={className} {...props}>
        {children}
        {badgeTitle && <Badge color="light" className="border-secondary border bg-white ml-2 mr-1">{badgeTitle}</Badge>}
    </DropdownItem>
};

export const LinkItemComingSoon = ({children}: {children: React.ReactNode}) => (
    <LinkItem to="/coming_soon" aria-disabled="true">
        <span className="mr-2 text-muted">{children}</span>
        <Badge  color="light" className="border-secondary border bg-white ml-auto mr-1">Coming soon</Badge>
    </LinkItem>
);

interface NavigationSectionProps {className?: string; children?: React.ReactNode; title: React.ReactNode; topLevelLink?: boolean; to?: string}
export const NavigationSection = ({className, children, title, topLevelLink, to}: NavigationSectionProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const toggle = () => {
        setIsOpen(!isOpen);
    }
    const linkClasses = siteSpecific("p-3 ml-3 mr-3", classNames("mx-0 mx-nav-1 p-3 font-h4", {"open": isOpen}));
    const dropdownClasses = siteSpecific("p-3 pt-0 m-0 mx-lg-4 nav-section", "p-3 pt-0 m-0 mx-nav-4 nav-section");
    return <MenuOpenContext.Consumer>
        {({setMenuOpen}) => <Dropdown className={className} nav inNavbar isOpen={isOpen} toggle={toggle}>
            {topLevelLink ?
                <NavLink className={linkClasses} tag={Link} to={to} onClick={() => setMenuOpen(false)}>{title}</NavLink> :
                <DropdownToggle nav caret={isPhy} className={linkClasses}>
                    {title}
                    {isAda && <span onClick={toggle} className={classNames("cs-caret float-right d-nav-none d-inline-block", {"open": isOpen})}/>}
                </DropdownToggle>}
            {children && <DropdownMenu className={dropdownClasses} onClick={() => setMenuOpen(false)}>
                {children}
            </DropdownMenu>}
        </Dropdown>}
    </MenuOpenContext.Consumer>
};

export function MenuBadge({count, message, ...rest}: {count: number, message: string} & HTMLProps<HTMLDivElement>) {
    if (count == 0) {
        return RenderNothing;
    }
    return <div className={"d-inline"} {...rest}>
        <span className="badge badge-pill bg-grey ml-2">{count}</span>
        <span className="sr-only"> {message}</span>
    </div>;
}

export function useAssignmentsCount() {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectors.user.orNull);
    const quizzes = useAppSelector(state => state?.quizAssignedToMe);
    const { data: assignments } = isaacApi.endpoints.getMyAssignments.useQuery(user?.loggedIn ? undefined : skipToken, {refetchOnMountOrArgChange: true, refetchOnReconnect: true});

    const loggedInUserId = isLoggedIn(user) ? user.id : undefined;
    useEffect(() => {
        if (user?.loggedIn) {
            dispatch(loadQuizAssignedToMe());
        }
    }, [dispatch, loggedInUserId]);

    const assignmentsCount = assignments
        ? filterAssignmentsByStatus(assignments).inProgressRecent.length
        : 0;
    const quizzesCount = quizzes && isFound(quizzes)
        ? partitionCompleteAndIncompleteQuizzes(quizzes)[1].length
        : 0;

    return {assignmentsCount, quizzesCount};
}

export const NavigationBar = ({children}: {children: React.ReactNode}) => {
    const [menuOpen, setMenuOpen] = useState(false);

    return <MenuOpenContext.Provider value={{menuOpen, setMenuOpen}}>
        <Navbar className="main-nav p-0" color="light" light expand="md">
            <NavbarToggler onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
                Menu
            </NavbarToggler>

            <Collapse isOpen={menuOpen} navbar className={classNames("px-0 mx-0 mx-xl-5", {"px-xl-5": isAda})}>
                <Nav navbar className="justify-content-between" id="main-menu">
                    {children}
                </Nav>
            </Collapse>
        </Navbar>
    </MenuOpenContext.Provider>
};
