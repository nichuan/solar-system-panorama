# 太阳系 · 真实全景模拟

可在浏览器中旋转、缩放和聚焦八大行星的 3D 太阳系。日期范围为 1800-01-01 至 2050-12-31，支持暂停、时间加速、轨道/标签/小行星带切换，以及探索视图和线性轨道距离视图。

## 本地运行

需要 Node.js 20.19+ 或 22.12+。

```bash
npm ci
npm run dev
```

生产构建：`npm run build`。GitHub Pages 工作流位于 `.github/workflows/pages.yml`，仓库 Pages Source 需设为 **GitHub Actions**。

## 科学依据与可视化边界

- 轨道方位使用 [NASA/JPL 的 1800–2050 年近似轨道要素及世纪变化率](https://ssd.jpl.nasa.gov/planets/approx_pos.html)，通过开普勒方程计算日心黄道坐标。它是低精度近似，不能用于航天导航或精密观测；地球位置使用地月质心，尚未添加月球对地心位置的修正。
- 行星平均半径、自转和公转周期取自 [NASA/JPL Planetary Physical Parameters](https://ssd.jpl.nasa.gov/planets/phys_par.html)；轴倾角取自 [NASA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)。地表贴图的本初子午线和旋转相位没有与 IAU 定义精确校准。
- 默认“探索视图”将日心距离映射为 `4.4 + 9.1√(AU)`，并单独放大天体半径，以便同屏观察。线性距离视图按 `5 单位/AU` 绘制轨道，天体半径仍有放大。两种视图都不表示统一几何比例。小行星带是示意性的随机粒子，并非真实小行星历表。
- 太阳光照、地球云层和夜间灯光、星空点位、行星大气与环的表现服务于沉浸感，属于视觉模拟。太阳系行星的可见表面和云层会随真实时间变化，本站所用静态纹理不实时更新。

## 素材署名

`public/textures/` 中的行星、太阳、地球昼夜/云层、土星环和银河纹理来自 [Solar System Scope 免费纹理库](https://www.solarsystemscope.com/textures/)，依 [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/) 使用。本站对素材进行了球面映射、亮度调整、光照和透明叠层处理。原作者说明，未观测区域部分由虚构地形补全，颜色略有增强；因此贴图不应理解为逐像素实测影像。项目没有得到 Solar System Scope 或 NASA 的赞助或背书。

## 部署

创建 GitHub 仓库并推送 `main`，在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。之后每次推送会自动构建并发布至 GitHub Pages。
