import React from "react";
import * as RS from "reactstrap";
import classnames from "classnames";
import {Link} from "react-router-dom";
import {IsaacPodDTO} from "../../../../IsaacApiTypes";
import {API_PATH} from "../../../services/constants";

export const NewsCard = ({newsItem, pod = false}: {newsItem: IsaacPodDTO; pod?: boolean}) => {
    const {id, title, value, image, url} = newsItem;

    return <RS.Card className={classnames({'card-neat': true, 'news-carousel': true, 'm-4': pod, 'mb-4': !pod})}>
        {image && <div className={'card-image'}>
            <RS.CardImg
                className={'news-card-image'} top
                src={API_PATH + "/images/" + image.src} alt={image.altText || `Illustration for ${title}`}
            />
        </div>}
        <RS.CardBody className="d-flex flex-column">
            <RS.CardText className="m-0 my-auto card-date-time">
                <span className="d-block my-2">
                    <h3 className="card-title">
                        {value}
                    </h3>
                </span>
            </RS.CardText>
            <RS.CardText>
                <Link className="focus-target" to={`${url}`}>
                    Read More
                </Link>
            </RS.CardText>
        </RS.CardBody>
    </RS.Card>
};
