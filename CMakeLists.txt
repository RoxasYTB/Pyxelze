cmake_minimum_required(VERSION 3.20)
project(Pyxelze VERSION 1.2.4 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)

find_package(Qt6 REQUIRED COMPONENTS Widgets Network Svg Concurrent)

set(SOURCES
    src/main.cpp
    src/core/AppConstants.h
    src/core/VirtualFile.h
    src/core/Logger.h
    src/core/Logger.cpp
    src/core/RoxRunner.h
    src/core/RoxRunner.cpp
    src/core/ProcessHelper.h
    src/core/ProcessHelper.cpp
    src/archive/ArchiveParser.h
    src/archive/ArchiveParser.cpp
    src/archive/CompressionService.h
    src/archive/CompressionService.cpp
    src/archive/ExtractionService.h
    src/archive/ExtractionService.cpp
    src/helpers/SizeFormatter.h
    src/helpers/SizeFormatter.cpp
    src/helpers/TempHelper.h
    src/helpers/TempHelper.cpp
    src/helpers/UpdateChecker.h
    src/helpers/UpdateChecker.cpp
    src/localization/Localization.h
    src/localization/Localization.cpp
    src/security/PassphraseManager.h
    src/security/PassphraseManager.cpp
    src/platform/PlatformService.h
    src/platform/PlatformService.cpp
    src/ui/ThemeManager.h
    src/ui/ThemeManager.cpp
    src/ui/MainWindow.h
    src/ui/MainWindow.cpp
    src/ui/AboutDialog.h
    src/ui/AboutDialog.cpp
    src/ui/ArchiveInfoDialog.h
    src/ui/ArchiveInfoDialog.cpp
    src/ui/ErrorDialog.h
    src/ui/ErrorDialog.cpp
    src/ui/ProgressDialog.h
    src/ui/ProgressDialog.cpp
    src/ui/PassphraseDialog.h
    src/ui/PassphraseDialog.cpp
    src/ui/IconProvider.h
    src/ui/IconProvider.cpp
    resources/resources.qrc
)

qt_add_executable(pyxelze ${SOURCES})

target_include_directories(pyxelze PRIVATE src)
target_link_libraries(pyxelze PRIVATE Qt6::Widgets Qt6::Network Qt6::Svg Qt6::Concurrent)

if(WIN32)
    set_target_properties(pyxelze PROPERTIES WIN32_EXECUTABLE TRUE)
endif()

if(APPLE)
    set(MACOSX_ICON "${CMAKE_SOURCE_DIR}/resources/icons/pyxelze.icns")
    set_source_files_properties(${MACOSX_ICON} PROPERTIES MACOSX_PACKAGE_LOCATION "Resources")
    target_sources(pyxelze PRIVATE ${MACOSX_ICON})
    set_target_properties(pyxelze PROPERTIES
        MACOSX_BUNDLE TRUE
        MACOSX_BUNDLE_BUNDLE_NAME "Pyxelze"
        MACOSX_BUNDLE_GUI_IDENTIFIER "com.roxasytb.pyxelze"
        MACOSX_BUNDLE_ICON_FILE "pyxelze.icns"
        MACOSX_BUNDLE_SHORT_VERSION_STRING "${PROJECT_VERSION}"
        MACOSX_BUNDLE_BUNDLE_VERSION "${PROJECT_VERSION}"
    )
endif()

if(WIN32)
    set(_rox_bin "roxify_native.exe")
else()
    set(_rox_bin "roxify_native")
endif()

set(ROXIFY_NATIVE "" CACHE FILEPATH "Path to roxify_native binary")
if(NOT ROXIFY_NATIVE)
    # Search sibling build directories (e.g. build-debug/roxify/)
    file(GLOB _build_dirs LIST_DIRECTORIES true "${CMAKE_SOURCE_DIR}/build-*/roxify/${_rox_bin}")
    foreach(_c IN LISTS _build_dirs)
        if(EXISTS "${_c}")
            set(ROXIFY_NATIVE "${_c}")
            break()
        endif()
    endforeach()
endif()
if(NOT ROXIFY_NATIVE)
    execute_process(
        COMMAND npm root -g
        OUTPUT_VARIABLE NPM_ROOT OUTPUT_STRIP_TRAILING_WHITESPACE
        ERROR_QUIET
    )
    if(NPM_ROOT)
        set(_candidates
            "${NPM_ROOT}/roxify/dist/${_rox_bin}"
            "${NPM_ROOT}/roxify/target/release/${_rox_bin}"
        )
        foreach(_c IN LISTS _candidates)
            if(EXISTS "${_c}")
                set(ROXIFY_NATIVE "${_c}")
                break()
            endif()
        endforeach()
    endif()
endif()

if(ROXIFY_NATIVE AND EXISTS "${ROXIFY_NATIVE}")
    message(STATUS "roxify_native: ${ROXIFY_NATIVE}")
    add_custom_command(TARGET pyxelze POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E make_directory "$<TARGET_FILE_DIR:pyxelze>/roxify"
        COMMAND ${CMAKE_COMMAND} -E copy_if_different "${ROXIFY_NATIVE}" "$<TARGET_FILE_DIR:pyxelze>/roxify/${_rox_bin}"
    )
    if(WIN32)
        install(PROGRAMS "${ROXIFY_NATIVE}" DESTINATION bin/roxify RENAME ${_rox_bin})
    else()
        install(PROGRAMS "${ROXIFY_NATIVE}" DESTINATION lib/pyxelze RENAME roxify_native)
    endif()
else()
    message(WARNING "roxify_native not found — set ROXIFY_NATIVE to the binary path")
endif()

install(TARGETS pyxelze
    RUNTIME DESTINATION bin
    BUNDLE DESTINATION .
)
