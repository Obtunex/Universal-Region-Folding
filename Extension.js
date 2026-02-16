const VSCode = require("vscode")

const CommentMap = {
    "lua": "--", "luau": "--", "python": "#", "ruby": "#", "perl": "#", "r": "#",
    "bash": "#", "shell": "#", "shellscript": "#", "powershell": "#", "yaml": "#",
    "sql": "--", "haskell": "--", "ada": "--", "vhdl": "--", "html": "<!--", "xml": "<!--",
    "css": "/*", "javascript": "//", "typescript": "//", "java": "//", "csharp": "//",
    "cpp": "//", "c": "//", "go": "//", "rust": "//", "php": "//", "swift": "//",
    "kotlin": "//", "dart": "//", "scala": "//", "matlab": "%", "tex": "%", "lisp": ";;",
    "fortran": "!", "pascal": "//", "vb": "'", "bat": "REM", "asm": ";"
}

module.exports = {
    activate(Context) {
        Context.subscriptions.push(
            VSCode.languages.registerFoldingRangeProvider(
                { pattern: "**" },
                {
                    provideFoldingRanges(Document) {
                        const Config = vscode.workspace.getConfiguration("UniversalRegionFolding")
                        const StartName = Config.get("StartName")
                        const EndName = Config.get("EndName")
                        
                        const Ranges = []
                        const StartStack = []
                        
                        for (let I = 0; I < Document.lineCount; I++) {
                            const Text = Document.lineAt(I).text
                            
                            if (Text.includes(StartName)) {
                                StartStack.push(I)
                            } else if (Text.includes(EndName) && StartStack.length > 0) {
                                Ranges.push(new vscode.FoldingRange(StartStack.pop(), I, vscode.FoldingRangeKind.Region))
                            }
                        }
                        
                        return Ranges
                    }
                }
            ),
            
            VSCode.commands.registerCommand(
                "UniversalRegionFolding.CreateRegion",
                async function() {
                    const Editor = VSCode.window.activeTextEditor
                    if (!Editor) return
                    
                    const Config = VSCode.workspace.getConfiguration("UniversalRegionFolding")
                    const StartName = Config.get("StartName")
                    const EndName = Config.get("EndName")
                    const RegionNameTemplate = Config.get("RegionName")
                    
                    const RegionName = await VSCode.window.showInputBox({
                        prompt: "Enter region name",
                        placeHolder: "MyRegion",
                        value: ""
                    })
                    
                    if (!RegionName) return
                    
                    const Selection = Editor.selection
                    const StartLine = Selection.start.line
                    const EndLine = Selection.end.line
                    const Document = Editor.document
                    
                    const Comment = CommentMap[Document.languageId] || "//"
                    const Indent = Document.lineAt(StartLine).text.match(/^(\s*)/)[1]
                    const RegionFormatted = RegionNameTemplate.replace("${Name}", RegionName)
                    
                    await Editor.edit(EditBuilder => {
                        EditBuilder.insert(
                            new VSCode.Position(StartLine, 0),
                            Indent + Comment + " " + StartName + " " + RegionFormatted + "\n"
                        )
                        EditBuilder.insert(
                            new VSCode.Position(EndLine, Document.lineAt(EndLine).text.length),
                            "\n" + Indent + Comment + " " + EndName
                        )
                    })
                }
            )
        )
    },
    
    deactivate() {}
}