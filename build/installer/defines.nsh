!ifndef DEFINES_INCLUDED
!define DEFINES_INCLUDED

!define MUI_ABORTWARNING

; 安装器图标
!ifndef MUI_ICON
  !define MUI_ICON "${BUILD_RESOURCES_DIR}\\icon.ico"
!endif

; 卸载器图标
!ifndef MUI_UNICON
  !define MUI_UNICON "${BUILD_RESOURCES_DIR}\\uninstall.ico"
!endif

; 欢迎页顶部图片
!ifndef MUI_HEADERIMAGE
  !define MUI_HEADERIMAGE
!endif

!ifndef MUI_HEADERIMAGE_BITMAP
  !define MUI_HEADERIMAGE_BITMAP "${BUILD_RESOURCES_DIR}\\welcome.bmp"
!endif

; 安装路径和输出配置
Name "My-starRail"
OutFile "${PROJECT_DIR}\\dist\\${PRODUCT_FILENAME} Setup ${VERSION}.exe"
InstallDir "$LOCALAPPDATA\\Programs\\My-starRail"
RequestExecutionLevel admin

!endif
