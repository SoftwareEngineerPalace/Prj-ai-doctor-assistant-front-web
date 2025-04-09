import React from "react";
import "./CollectInfoCard.less";

const CollectInfoCard = (props: any) => {
  const { connectCollectInfo } = props;
  // console.log({ connectCollectInfo });
  return (
    <div className="collectInfoCard">
      <div className="title">已关联采集信息</div>
      <div className="row">
        <div className="label">姓名: </div>
        <div className="content">{connectCollectInfo?.visitor_name}</div>
      </div>
      <div className="row">
        <div className="label">性别: </div>
        <div className="content">
          {connectCollectInfo?.visitor_gender === "male" && "男"}
          {connectCollectInfo?.visitor_gender === "female" && "女"}
        </div>
      </div>
      <div className="row">
        <div className="label">出生日期: </div>
        <div className="content">{connectCollectInfo?.visitor_birth}</div>
      </div>
      <div className="row">
        <div className="label">手机号: </div>
        <div className="content">{connectCollectInfo?.visitor_phone}</div>
      </div>
    </div>
  );
};

export default CollectInfoCard;
