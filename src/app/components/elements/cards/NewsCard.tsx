import React from "react";
import {Link} from "react-router-dom";
import {Button, Card, CardBody, CardFooter, CardImg, CardText, CardTitle} from "reactstrap";
import {IsaacPodDTO} from "../../../../IsaacApiTypes";
import {apiHelper, isAppLink, siteSpecific} from "../../../services";
import classNames from "classnames";

interface NewsCardProps {
    newsItem: IsaacPodDTO;
    showTitle?: boolean;
}

const PhysicsNewsCard = ({newsItem, showTitle}: NewsCardProps) => {
    const {title, value, image, url} = newsItem;

    return <Card data-testid={"news-pod"} className={"card-neat news-card"}>
        {image && <a href={url}>
            <CardImg
                top
                src={image.src && apiHelper.determineImageUrl(image.src)}
                alt={image.altText || `Illustration for ${title}`}
            />
        </a>}
        <CardBody className="d-flex flex-column">
            <div className="m-0 mb-auto">
                <span className="d-block my-2">
                    {showTitle ?
                        <div>
                            <h3 className="card-title">
                                {title}
                            </h3>
                            <p>
                                {value}
                            </p>
                        </div>:
                        <h3 className="card-title">
                            {value}
                        </h3>
                    }
                </span>
            </div>
            <CardText>
                {!url?.startsWith("http") ?
                    <Link className="focus-target" to={`${url}`}>
                        Read more
                    </Link> :
                    // eslint-disable-next-line react/jsx-no-target-blank
                    <a className="focus-target" href={url} target="_blank" rel="noopener">
                        Find out more
                    </a>
                }
            </CardText>
        </CardBody>
    </Card>
};

export const AdaNewsCard = ({newsItem, showTitle}: NewsCardProps) => {
    const {title, value, image, url} = newsItem;
    return <Card className={classNames("news-card border-0 pb-3 my-3 my-xl-0")}>
        {image && <a href={url} className={"w-100"}>
            <CardImg
                className={"news-card-image"}
                top
                src={(image.src && apiHelper.determineImageUrl(image.src)) || "/assets/cs/decor/news-placeholder.png"}
                alt={image.altText || `Illustration for ${title}`}
            />
        </a>}
        {showTitle && <>
            <CardTitle className={classNames("news-card-title px-4", {"mt-5": !image, "mt-3": image})}>
                <h4>{title}</h4>
            </CardTitle>
            <CardBody className={"px-4 py-2"}>
                <p>{value}</p>
            </CardBody>
        </>}
        {url && !url?.startsWith("http") && isAppLink(url) && <CardFooter className={"border-top-0 p-4"}>
            <Button outline color={"secondary"} tag={Link} to={url}>Read more</Button>
        </CardFooter>}
    </Card>;
};

export const NewsCard = siteSpecific(PhysicsNewsCard, AdaNewsCard);