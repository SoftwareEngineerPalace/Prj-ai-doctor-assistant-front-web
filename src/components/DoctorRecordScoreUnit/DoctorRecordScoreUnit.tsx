import { Flex, InputNumber, Typography } from "antd";
import React from "react";
import PropTypes from "prop-types";
import { IScoreVO } from "@/common/types";
import style from "./DoctorRecordScoreUnit.module.css";

const { Text } = Typography;

interface Props {
  title: string;
  onScoreChanged: (vo: IScoreVO) => void;
  maxScore: number;
  scoreItemName: string;
  rules: { [key: string]: any };
  defaultScore: number;
}

const DoctorRecordScoreUnit: React.FC<Props> = ({
  title,
  maxScore,
  onScoreChanged,
  scoreItemName,
  rules,
  defaultScore,
}) => {
  // console.dir({ title, maxScore, onScoreChanged, scoreItemName, rules });
  const vo = rules[scoreItemName] || {};
  const { cn_name } = vo;
  return (
    <Flex vertical style={{ marginBottom: 24 }}>
      <Text className={style.title}>{`${title || cn_name}:`}</Text>
      <InputNumber
        max={maxScore}
        min={0}
        precision={1}
        style={{ alignSelf: "flex-end", width: 115, marginTop: 12 }}
        addonBefore={`评分`}
        onChange={(score) => {
          onScoreChanged({ name: scoreItemName, score: score || 0 });
        }}
        defaultValue={defaultScore}
      />
      <Text
        style={{
          alignSelf: "flex-end",
          marginTop: 4,
          color: "#000000A6",
          fontSize: 12,
        }}
      >{`共 ${maxScore} 分`}</Text>
    </Flex>
  );
};

DoctorRecordScoreUnit.propTypes = {
  title: PropTypes.string.isRequired,
  maxScore: PropTypes.number.isRequired,
  onScoreChanged: PropTypes.func.isRequired,
  rules: PropTypes.object.isRequired,
};

export default DoctorRecordScoreUnit;
