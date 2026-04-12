/**
 * 交互动画 play 页与教立方教具的对照（导航 JSON + hashId）。
 * 徐老师导航目录 API 快照（标题/简介/play 链）：`data/jiaohukejian-works-catalog.json`（可用 curl 或 Playwright 定期更新）。
 * play 地址：https://www.jiaohukejian.com/math/play/{hashId}/
 *
 * **用途（竞品参考，非代码复刻）**：仅记录「对方课题标识 ↔ 教立方教具 id」与体验验收要点，
 * 便于产品、教研对齐进度；教立方中的 HTML/脚本均为自研或占位壳，不得嵌入或翻译对方源码。
 *
 * mappedToolId：已在年级数据等处的完整教具 id；为 null 时由 stubToolId（`reference-stubs`）承接。
 * uxFocus：**交互与课堂体验**应对标的方向（操作路径、反馈时机、动画节奏、触控热区等），
 * 而非仅外壳样式；实现时以此为验收口径。
 */

export interface ReferencePlayMapping {
  hashId: string;
  title: string;
  category: "四年级" | "五年级" | "六年级";
  displayOrder: number;
  /** 教立方已有 `public/tools/{id}.html`；占位条目为 null */
  mappedToolId: string | null;
  /** 占位教具 id（仅 mappedToolId 为 null 时有效） */
  stubToolId?: string;
  /** 参考 play 应在交互/体验上对齐的要点（简述） */
  uxFocus: string;
}

export const REFERENCE_PLAY_MAPPINGS: ReferencePlayMapping[] = [
  { hashId: "193DIGW", title: "包装盒捆扎问题", category: "五年级", displayOrder: 1, mappedToolId: null, stubToolId: "gift-wrap-packaging", uxFocus: "捆扎方式切换即时改变绳路可视；长宽高调参跟手；拆解/还原动画节奏清晰，便于全班跟随。" },
  { hashId: "0SZLFA2", title: "五下表面积难题", category: "五年级", displayOrder: 2, mappedToolId: null, stubToolId: "surface-area-hard-p5", uxFocus: "切割或挖空后表面积变化立即算清；多道题切换不丢状态感；关键面高亮与数值同步。" },
  { hashId: "127FEAT", title: "水中浸物（排水法求体积）", category: "五年级", displayOrder: 3, mappedToolId: "water-displacement", uxFocus: "放入/取出与液面动画同步；读数与「上升体积」推理步骤一致；大屏上刻度与数字对比明显。" },
  { hashId: "0C6OVSC", title: "表面积难题2类", category: "六年级", displayOrder: 4, mappedToolId: null, stubToolId: "surface-area-stack-p6", uxFocus: "叠放、变高引起表面积变化可逐步试；组合体分层操作与总和反馈一致。" },
  { hashId: "00CZI2H", title: "环形相遇追及问题", category: "四年级", displayOrder: 5, mappedToolId: null, stubToolId: "ring-track-meet-chase", uxFocus: "双对象运动与环形轨迹同步可见；相遇/追及瞬间可暂停回看；拖动时间轴重播。" },
  { hashId: "0LEIT9Z", title: "鸡兔同笼", category: "四年级", displayOrder: 6, mappedToolId: null, stubToolId: "chicken-rabbit-cage", uxFocus: "增删鸡兔与腿数同步；假设调整过程可逆；小学直观反馈优先于公式堆砌。" },
  { hashId: "1E5TA88", title: "表面涂色问题", category: "五年级", displayOrder: 7, mappedToolId: "block-build", uxFocus: "涂色面分类与计数同步；阶数变化时几何体可旋转观察；结果与「三面/两面」等规律核对顺畅。" },
  { hashId: "055FQDD", title: "长方体茶盒", category: "五年级", displayOrder: 8, mappedToolId: "cuboid-volume", uxFocus: "容器与茶盒摆放尝试无卡顿；多少件最优结论与试摆过程可对照。" },
  { hashId: "1NDNJ6B", title: "圆柱圆锥复习课", category: "六年级", displayOrder: 9, mappedToolId: "shape-composite", uxFocus: "瓶倒置、削最大圆柱等场景切换顺滑；体积关系演示与题干步骤一致。" },
  { hashId: "1UC3JB2", title: "正比例与反比例", category: "六年级", displayOrder: 10, mappedToolId: null, stubToolId: "direct-inverse-proportion", uxFocus: "改自变量时点图/表格/解析式同步更新；正反例对比一眼可辨。" },
  { hashId: "1O09ST7", title: "圆柱的体积", category: "六年级", displayOrder: 11, mappedToolId: "cylinder-volume", uxFocus: "分割份数极限演示跟手；底面积×高与不同直柱对比反馈即时。" },
  { hashId: "179V6GD", title: "观察物体（三）", category: "五年级", displayOrder: 12, mappedToolId: "observe-obj3", uxFocus: "积木放置与三视图联动低延迟；预设场景切换不眩晕；大屏上格子与线框对比清晰。" },
  { hashId: "1UYPTAE", title: "长（正）方体的体积和进率", category: "五年级", displayOrder: 13, mappedToolId: "volume-units", uxFocus: "单位堆叠与进率演示动画可暂停；体积与容积口语切换友好。" },
  { hashId: "0JFPR2O", title: "多边形内角和", category: "四年级", displayOrder: 14, mappedToolId: null, stubToolId: "polygon-angle-sum", uxFocus: "边数增加与内角和变化同步；拼角与辅助线两种验证路径可切换。" },
  { hashId: "0QGYWHR", title: "圆锥的体积", category: "六年级", displayOrder: 15, mappedToolId: "cone-explore", uxFocus: "倒沙/等高圆柱对比动画连贯；母线与底面调节时体积反馈连续。" },
  { hashId: "0GZ5E0K", title: "长（正）方体表面积和展开图", category: "五年级", displayOrder: 16, mappedToolId: "cuboid-unfold", uxFocus: "展开折叠过程不丢对应关系；面间高亮与表面积数字同步更新。" },
  { hashId: "0XS1NKY", title: "面动成体", category: "六年级", displayOrder: 17, mappedToolId: "surface-revolve", uxFocus: "轮廓绕轴旋转跟手；截面与成体同时可见；速度适中便于讲解。" },
  { hashId: "0A7VV61", title: "圆柱表面积", category: "六年级", displayOrder: 18, mappedToolId: "cylinder-explore", uxFocus: "展开侧面积与底面同时展示；半径高变化时展开图实时变形。" },
  { hashId: "1XV65WR", title: "阴影面积", category: "六年级", displayOrder: 19, mappedToolId: null, stubToolId: "shadow-area-explore", uxFocus: "割补与旋转操作可撤销；阴影边界变化时面积反馈连续。" },
  { hashId: "1LWRXC4", title: "圆绕图形运动", category: "六年级", displayOrder: 20, mappedToolId: null, stubToolId: "circle-rolling-motion", uxFocus: "圆心轨迹与扫过区域同步；速度/半径调节时仍保持跟手。" },
  { hashId: "081VZUA", title: "阴影部分随机出题系统", category: "六年级", displayOrder: 21, mappedToolId: null, stubToolId: "shadow-area-generator", uxFocus: "出题—作答—解析链路完整；再随机时不闪烁布局。" },
  { hashId: "0OUSM1S", title: "拉窗帘模型", category: "五年级", displayOrder: 22, mappedToolId: "grid-scale", uxFocus: "等积变形过程可逐步播放；对应边与面积关系反馈明确。" },
  { hashId: "1H4RGFX", title: "平面图形面积推导", category: "五年级", displayOrder: 23, mappedToolId: null, stubToolId: "plane-shape-area-derive", uxFocus: "割补动画与公式文字同步出现；多种图形切换保持统一操作习惯。" },
  { hashId: "153VNRQ", title: "羊吃草问题", category: "六年级", displayOrder: 24, mappedToolId: null, stubToolId: "goat-grazing-problem", uxFocus: "绳长与障碍墙变化后活动区域立即重算；扇形拼接可视化清晰。" },
  { hashId: "0F0C0CX", title: "数与形", category: "六年级", displayOrder: 25, mappedToolId: null, stubToolId: "numbers-and-shapes", uxFocus: "数列变动时点阵与式子同步；规律猜想有试错空间。" },
  { hashId: "0K2C13S", title: "工程问题", category: "六年级", displayOrder: 26, mappedToolId: null, stubToolId: "engineering-work-problems", uxFocus: "工量条与天数关系一眼可读；随机题干生成保持相同交互骨架。" },
  { hashId: "1SSQ143", title: "圆的面积", category: "六年级", displayOrder: 27, mappedToolId: null, stubToolId: "circle-area-lesson", uxFocus: "等分份数拉高时拼摆趋近圆；面积与半圆周关系讲解节奏可控。" },
  { hashId: "0VW1RV3", title: "植树问题", category: "五年级", displayOrder: 28, mappedToolId: null, stubToolId: "tree-planting-problem", uxFocus: "线段/环形模型一键切换；棵树与间隔数同步高亮。" },
  { hashId: "039FV1M", title: "六上计算出题系统", category: "六年级", displayOrder: 29, mappedToolId: null, stubToolId: "grade6-calc-generator", uxFocus: "换题瞬时、版式稳定；导出/打印路径不破坏课堂节奏。" },
  { hashId: "1C2BOAD", title: "量角器炮塔", category: "四年级", displayOrder: 30, mappedToolId: null, stubToolId: "protractor-turret-game", uxFocus: "读角反馈即时且鼓励重试；触控瞄准时有吸附辅助。" },
  { hashId: "1LK575O", title: "确定起跑线", category: "六年级", displayOrder: 31, mappedToolId: null, stubToolId: "track-start-lines", uxFocus: "跑道展开与弯道差距数值同步；缩放仍易读。" },
  { hashId: "0QTLN2F", title: "浓度问题", category: "六年级", displayOrder: 32, mappedToolId: null, stubToolId: "concentration-mixture", uxFocus: "加盐/加水后浓度与颜色或条带同步；关键步骤可暂停讲解。" },
];

/** play 页完整 URL */
export function playUrlForHash(hashId: string): string {
  return `https://www.jiaohukejian.com/math/play/${hashId}/`;
}

/** 本条在教立方中对应的 iframe 教具 id（已有或占位） */
export function educubeToolIdForPlay(row: ReferencePlayMapping): string {
  if (row.mappedToolId) return row.mappedToolId;
  if (row.stubToolId) return row.stubToolId;
  return "";
}

export function getPlayMappingByHash(hashId: string): ReferencePlayMapping | undefined {
  return REFERENCE_PLAY_MAPPINGS.find((r) => r.hashId === hashId);
}
