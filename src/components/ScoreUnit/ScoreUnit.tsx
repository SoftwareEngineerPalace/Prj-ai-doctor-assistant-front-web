import { Descriptions, Flex, InputNumber, Typography } from "antd";
import React from "react";
import PropTypes from "prop-types";
import { IScoreVO } from "@/common/types";
const { Text } = Typography;

interface Props {
  title: string;
  items: any[];
  onScoreChanged: (vo: IScoreVO) => void;
  maxScore: number;
  column: number;
  scoreItemName: string;
  defaultValue: number;
}

const ScoreUnit: React.FC<Props> = ({
  items,
  title,
  maxScore,
  onScoreChanged,
  column,
  scoreItemName,
  defaultValue,
}) => {
  if (column === 1) {
    // console.log(`ScoreUnit, items`, items);
  }
  return (
    <Flex vertical>
      <Descriptions title={title} items={items} column={column ?? 3} />
      <InputNumber
        max={maxScore}
        min={0}
        defaultValue={defaultValue}
        precision={1}
        style={{ alignSelf: "flex-end", width: 115, marginTop: 12 }}
        addonBefore={`评分`}
        onChange={(score) => {
          onScoreChanged({ name: scoreItemName, score: score || 0 });
        }}
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

ScoreUnit.propTypes = {
  items: PropTypes.array.isRequired, // 将 items 设为必填项
  title: PropTypes.string.isRequired,
  maxScore: PropTypes.number.isRequired,
  onScoreChanged: PropTypes.func.isRequired,
};

export default ScoreUnit;
