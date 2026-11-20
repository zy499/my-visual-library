export const names = {reference:"视觉参考", technique:"动效与技法", style:"风格库"};
const sourceVideo = "https://www.douyin.com/video/7708581319843794191";
export const artTypes = ["ref", "motion", "light", "paper"];
export const samples = [
  {id:"sample-reference",type:"reference",title:"持续可见的章节导航",source:sourceVideo,time:"00:48",
    tags:["口播","章节","排版"],art:"ref",sample:true,
    note:"一页枝鸥的画面顶部保留整条章节导航，用当前段落的高亮提示位置。卡片封面是结构示意。",
    recipe:"用于多段知识口播。导航固定在顶部安全区，只高亮正在讲的章节；在段落切换时更新。先拿已有视频试一次，看它会不会与主标题争夺注意力。"},
  {id:"sample-reveal",type:"technique",title:"遮罩揭示 · Mask Reveal",source:sourceVideo,time:"03:24",
    tags:["动效","标题","入场"],art:"motion",sample:true,
    note:"文字从不可见的边界后方移入。试着悬停在示例封面上看它的运动。",
    recipe:"用于观点标题入场。固定矩形遮罩，文字从下方向上移动到原位，约 0.45 秒，缓出。两行之间错开约 0.08 秒。示例数值可按口播节奏调整。"},
  {id:"sample-light",type:"technique",title:"轮廓光 · Rim Light",source:sourceVideo,time:"03:12",
    tags:["光影","布光","产品"],art:"light",sample:true,
    note:"从主体后侧打光，让边缘出现一圈亮部，把主体和背景分开。卡片封面是单侧轮廓光示意。",
    recipe:"用于暗背景产品特写。主光先定整体明暗，再在主体后侧补一条窄而柔的边光。保留主体正面的层次，检查边缘高光是否过曝。"},
  {id:"sample-style",type:"style",title:"纸本编辑部",source:"",time:"",
    tags:["知识口播","纸感","暖色"],art:"paper",sample:true,
    note:"原创练习方向，适合知识口播的观点卡和章节页。固定暖纸底色、深灰标题、朱红重点线。",
    recipe:"颜色：纸色 #E9DBC1，深灰 #2A332C，朱红 #A84029。排版：宋体标题靠左，正文用无衬线体，右侧留白。动效：标题用遮罩向上揭示，重点线最后出现。变化：强调色可随栏目切换。避开厚重投影和大面积纸纹，以手机端字清晰为准。先在同一条视频验证片头、观点卡和结尾。"}
];
