!ifndef FUNCTIONS_INCLUDED
!define FUNCTIONS_INCLUDED

!include "nsDialogs.nsh"
!include "LogicLib.nsh"

Function customWelcome
  nsDialogs::Create 1018
  Pop $Dialog
  ${If} $Dialog == error
    Abort
  ${EndIf}
  ${NSD_CreateLabel} 0 20 100% 12u "欢迎使用 My-starRail"
  Pop $0
  ${NSD_SetFont} $0 "Arial" 16
  nsDialogs::Show
FunctionEnd

Function customFinish
  nsDialogs::Create 1018
  Pop $Dialog
  ${If} $Dialog == error
    Abort
  ${EndIf}
  ${NSD_CreateLabel} 0 30 100% 12u "安装完成"
  Pop $0
  ${NSD_CreateButton} 50% 60% 100u 14u "立即启动"
  Pop $Button
  ${NSD_OnClick} $Button execApp
  nsDialogs::Show
FunctionEnd

Function execApp
  Exec "$INSTDIR\\My-starRail.exe"
FunctionEnd

Function un.customConfirm
  nsDialogs::Create 1018
  Pop $Dialog
  ${If} $Dialog == error
    Abort
  ${EndIf}
  ${NSD_CreateLabel} 0 20 100% 12u "你确定要卸载 My-starRail 吗？"
  Pop $0
  ${NSD_CreateButton} 30% 50% 60u 14u "是(Y)"
  Pop $YesButton
  ${NSD_OnClick} $YesButton uncontinue

  ${NSD_CreateButton} 60% 50% 60u 14u "否(N)"
  Pop $NoButton
  ${NSD_OnClick} $NoButton unabort
  nsDialogs::Show
FunctionEnd

Function uncontinue
  Call un.done
FunctionEnd

Function unabort
  Abort
FunctionEnd

Function un.done
FunctionEnd

!endif
